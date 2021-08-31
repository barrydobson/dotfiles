#!/usr/bin/env zsh

role=$1
acc=$2
shift 2
awsudo arn:aws:iam::${acc}:role/${role} "${@}"
