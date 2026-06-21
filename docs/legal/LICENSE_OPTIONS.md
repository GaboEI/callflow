# License options for CallFlow

Status: historical comparison only. The repository root now uses Apache 2.0.

Useful references:

- Open Source Initiative approved licenses: https://opensource.org/licenses
- Choose a License overview and license summaries: https://choosealicense.com/licenses/

## Current project state

`package.json` and the repository root now use Apache 2.0. This document is kept as a comparison reference for future licensing discussions.

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

Apache 2.0 was chosen for the repository because it gives the project a permissive public license with clear patent language and a professional default for a GitHub portfolio repo.
