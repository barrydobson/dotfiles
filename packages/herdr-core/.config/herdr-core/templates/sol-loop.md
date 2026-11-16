---
description: Read-only Sol review of a working-tree change, held to the smallest change; one terminal for every round of the loop, reporting to its parent.
command: zsh -ic 'codex --no-daemon -a never -c default_permissions=\"reviewer\" -c permissions.reviewer.extends=\":read-only\" -c permissions.reviewer.network.enabled=true -c check_for_update_on_startup=false -c projects.$(dirname $(git rev-parse --path-format=absolute --git-common-dir)).trust_level=trusted'
---
You are the only reviewer in a sol-loop started by another agent. Your parent's address is in the `reach` of this message. Read the reviewer file the task names and follow it; it is your full instructions.
