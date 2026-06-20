# License options for CallFlow

Status: comparison only. No license is applied by this document.

Useful references:

- Open Source Initiative approved licenses: https://opensource.org/licenses
- Choose a License overview and license summaries: https://choosealicense.com/licenses/

## Current project state

`package.json` currently uses `UNLICENSED` and the repository has no final root `LICENSE` file. That means a final license still needs an explicit decision before public distribution expectations are clear.

## Practical comparison

| License | Allows commercial use | Requires sharing modifications | Patent grant | Practical effect for CallFlow |
| --- | --- | --- | --- | --- |
| MIT | Yes | No | No explicit patent grant | Simple, widely understood, permissive, includes no-warranty language. Good if you want others to use, study, modify, and even commercialize with minimal friction. |
| Apache 2.0 | Yes | No | Yes | More explicit protection around patents and contributions. Good if you want a permissive license with stronger legal clarity than MIT. |
| GPL v3 | Yes | Yes, when distributed | No Apache-style patent section, but includes patent-related terms | Strong copyleft. If someone distributes a modified CallFlow, they generally need to provide source under GPL-compatible terms. More restrictive for commercial reuse. |
| AGPL v3 | Yes | Yes, including network use | Similar copyleft family protections | Strongest copyleft option here. More relevant for server/network software; likely heavier than needed for a local Electron MVP unless you specifically want network-service copyleft. |
| PolyForm Noncommercial / custom noncommercial | Usually no commercial use | Depends on text | Depends on text | Can block commercial reuse, but is not a standard open-source license under the Open Source Definition. Creates more friction and legal review needs. |
| Proprietary / all rights reserved | No unless granted | No | Depends on text | Maximum control, but does not meet open-source publishing goals. |

## Recommendation for CallFlow

For the stated goals, the best candidates are:

1. Apache 2.0 if you want permissive open source with clearer patent language and a professional default for a public GitHub project.
2. MIT if you want the shortest, simplest, most familiar permissive license.

If the goal is to prevent others from using CallFlow commercially, MIT and Apache 2.0 are not the right fit because they allow commercial use. A noncommercial/custom license can do that, but it would no longer be standard open source and should be reviewed carefully.

No root license file should be added until the final choice is confirmed.

