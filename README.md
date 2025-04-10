# pi-rfid

In a push-based system, the devices will only send information, when there
is a change in their state. This avoids the unnecessary polling when there
are no such events. When the state does change, the change of state should
be reported to other devices instead of the entire current state.

All these state changes should be recorded and maintained by a separate.
The module should enable syncing between devices, but it should be detached
from group support module. There could be a module to view logs as well.

On initial sync what should be done? get full state?
How should devices perform sync, and state changed be recorded?

![](https://ga-beacon.deno.dev/G-4NEP5LC20N:1fbE9YTHTw2pzxI6HO33Mw/github.com/pantryf/rfid.rpi)
