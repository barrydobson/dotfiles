#!/usr/bin/env python3
import os
import json
import argparse
import subprocess
import configparser

parser = argparse.ArgumentParser(description='Update your AWS CLI Token')
parser.add_argument('token', help='token from your MFA device')
parser.add_argument('--profile', help='aws profile to store the session token', default=os.getenv('AWS_PROFILE'))
parser.add_argument('--arn', help='AWS ARN from the IAM console (Security credentials -> Assigned MFA device). This is saved to your .aws/credentials file')
parser.add_argument('--credential-path', help='path to the aws credentials file', default=os.path.expanduser('~/.aws/credentials'))
parser.add_argument('--config-path', help='path to the aws config file', default=os.path.expanduser('~/.aws/config'))

args = parser.parse_args()

if args.profile is None:
    parser.error('Expecting --profile or profile set in environment AWS_PROFILE. e.g. "stage"')

creds = configparser.ConfigParser()
creds.read(args.credential_path)

cfg = configparser.ConfigParser()
cfg.read(args.config_path)

if args.profile not in creds.sections():
    parser.error('Invalid profile. Section not found in ~/.aws/credentails')

if 'profile ' + args.profile not in cfg.sections():
    parser.error('Invalid profile. Section not found in ~/.aws/config')

if args.arn is None:
    if 'aws_arn_mfa' not in creds[args.profile]:
        parser.error('ARN is not provided. Specify via --arn')

    args.arn = creds[args.profile]['aws_arn_mfa']
else:
    # Update the arn with user supplied one
    creds[args.profile]['aws_arn_mfa'] = args.arn

assume_account = cfg['profile ' + args.profile]['account']
assume_role = cfg['profile ' + args.profile]['role']

# Generate the session token from the default profile based on the environment. We do not want to overwrite these profiles as we wouldn't
# be able to generate another token
result = subprocess.run(['aws', 'sts', 'assume-role', '--role-arn', 'arn:aws:iam::' + assume_account + ':role/' + assume_role, '--role-session-name', 'assume-' + args.profile, '--profile', 'default', '--serial-number', args.arn, '--token-code', args.token], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if result.returncode != 0:
    parser.error(result.stderr.decode('utf-8').strip('\n'))

credentials = json.loads(result.stdout.decode('utf-8'))['Credentials']

creds[args.profile]['aws_access_key_id'] = credentials['AccessKeyId']
creds[args.profile]['aws_secret_access_key'] = credentials['SecretAccessKey']
creds[args.profile]['aws_session_token'] = credentials['SessionToken']

# Save the changes back to the file
with open(args.credential_path, 'w') as configFile:
    creds.write(configFile)

print('Saved {} credentials to {}'.format(args.profile, args.credential_path))