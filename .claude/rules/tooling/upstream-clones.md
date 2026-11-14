# Reading the Upstream Clones

Applies whenever the main session reads a local clone of `jgraph/drawio` or `jgraph/mxgraph` itself, rather than through
the `mxgraph-archaeologist` agent, for instance to check a claim of the agent or to compare a function with its draw.io
version while implementing a fix. Identify a clone by its remote, `git -C <clone> remote get-url origin`, never by its
directory name.

## Read at the remote ref, never in the working tree

The checkout of a clone moves only when its owner pulls, so it can be weeks behind. The `jgraph/drawio` clone used for
issue #1051 was still checked out at `31.5.3` a month after `32.0.1` had reworked the `SegmentConnector` the analysis
recommended to port, and both the agent of the time and the main session read it there.

Before saying anything about what draw.io does today:

```bash
git -C <clone> fetch --quiet origin
git -C <clone> rev-parse origin/HEAD; git ls-remote https://github.com/jgraph/drawio HEAD
git -C <clone> show origin/HEAD:<path>
git -C <clone> grep <pattern> origin/HEAD -- <path>
```

Do not use the Read and Grep tools on the files of a clone to describe its current behaviour. They read the working
tree. `jgraph/mxgraph` is archived and needs no fetch.

## Refresh an analysis before implementing from it

A previous analysis, an attachment to an issue or a report of the agent, is a snapshot. Before implementing from it,
list what changed upstream since the revision it read, with the command of its Refresh block, or by asking the
`mxgraph-archaeologist` agent for a refresh. Report the result even when nothing changed.
