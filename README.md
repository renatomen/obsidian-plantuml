# PlantUML Support for Obsidian

[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

Render [PlantUML](https://plantuml.com) Diagrams in [Obsidian](https://obsidian.md)

---

![Demonstration](https://i.joethei.space/c5CVp0aX6h.gif)

This plugin can render with the [PlantUML Online Server](https://plantuml.com/server), a server you
host yourself, a local `.jar` file, or a JavaScript build of PlantUML bundled into the plugin.

You can host your own server
([Docker](https://hub.docker.com/r/plantuml/plantuml-server) /
[JEE](https://plantuml.com/de/server) /
[PicoWeb](https://plantuml.com/de/picoweb)) and specify its address in the settings.

Please note that using the local rendering method is not as performant as using a server.

### Bundled renderer

Set `Renderer` to `Bundled JavaScript engine` in the settings to render diagrams inside Obsidian
itself, with no server, no Java and no network. It is the only option that works on mobile without
a reachable server, and it works offline. Changing the setting takes effect after you reload
Obsidian.

The engine is bundled as an asset rather than downloaded at runtime, so it ships to every install
whether or not you enable it. It also has real limits compared to the server and `.jar` backends —
see `Known issues` below.

## Usage
Create a fenced code block using `plantuml` or `puml` as the language.
Specify your PlantUML code inside.
Plain `plantuml` and `puml` blocks use the **Default diagram format** setting, which defaults to PNG and can be set to SVG for sharper diagrams.
Explicit format fences such as `plantuml-png` and `plantuml-svg` override this setting.

You can also use `plantuml-ascii` to generate ASCII Art.

Documentation on Plantuml can be found on [plantuml.com](https://plantuml.com/)

### Linking to notes in vault

Since the syntax for weblinks in PlantUML is the same for as for Wikilinks in Obsidian,
a special syntax is used:
`[[[Your other note]]]`
For the content of such a link refer to the [obisidian documentation](https://help.obsidian.md/How+to/Internal+link).

Normal web links are described [here](https://plantuml.com/de/link)

### Including an `.puml` file
> ⚠️ Only works when using local rendering

This works just as describe in the [official documentation](https://plantuml.com/de/preprocessing#393335a6fd28a804).

### Examples

~~~markdown
```plantuml
Bob -> Alice : hello
Alice -> Wonderland: hello
Wonderland -> next: hello
next -> Last: hello
Last -> next: hello
next -> Wonderland : hello
Wonderland -> Alice : hello
Alice -> Bob: hello
```
~~~

results in:

![](http://www.plantuml.com/plantuml/png/SyfFEhH0r-xG0iUSpEJKGmki3Yt8ICt9oUS2yo5IuVbvAQb5EObvAN1PX114ILvgHGbSKW48G08GAP_4ObGfa011NSWMe2X1IA2x6w46oUr0_y6a0000)

~~~markdown
```plantuml-ascii
Bob -> Alice : hello
Alice -> Wonderland: hello
Wonderland -> next: hello
next -> Last: hello
Last -> next: hello
next -> Wonderland : hello
Wonderland -> Alice : hello
Alice -> Bob: hello
```
~~~

results in:
```
     ┌───┐          ┌─────┐          ┌──────────┐          ┌────┐          ┌────┐
     │Bob│          │Alice│          │Wonderland│          │next│          │Last│
     └─┬─┘          └──┬──┘          └────┬─────┘          └─┬──┘          └─┬──┘
       │    hello      │                  │                  │               │   
       │──────────────>│                  │                  │               │   
       │               │                  │                  │               │   
       │               │      hello       │                  │               │   
       │               │─────────────────>│                  │               │   
       │               │                  │                  │               │   
       │               │                  │       hello      │               │   
       │               │                  │ ─────────────────>               │   
       │               │                  │                  │               │   
       │               │                  │                  │     hello     │   
       │               │                  │                  │ ──────────────>   
       │               │                  │                  │               │   
       │               │                  │                  │     hello     │   
       │               │                  │                  │ <──────────────   
       │               │                  │                  │               │   
       │               │                  │       hello      │               │   
       │               │                  │ <─────────────────               │   
       │               │                  │                  │               │   
       │               │      hello       │                  │               │   
       │               │<─────────────────│                  │               │   
       │               │                  │                  │               │   
       │    hello      │                  │                  │               │   
       │<──────────────│                  │                  │               │   
     ┌─┴─┐          ┌──┴──┐          ┌────┴─────┐          ┌─┴──┐          ┌─┴──┐
     │Bob│          │Alice│          │Wonderland│          │next│          │Last│
     └───┘          └─────┘          └──────────┘          └────┘          └────┘
```


## Known issues
Not all methods of using PlantUML support all different diagrams.
Following are a few known issues.
- ASCII can only ever generate Sequence diagrams
- The PicoWeb server does not support clickable links in png diagrams
- Some languages like chinese are not rendered correctly -> Switch to SVG rendering

The bundled JavaScript renderer additionally:
- produces no clickable links, in either svg or png diagrams
- produces no image map, so a `plantuml-map` block renders a picture with nothing to click and no warning
- cannot produce ASCII art; `plantuml-ascii` blocks report that instead of rendering
- does not support `!include <...>` of the standard library, `!theme`, emoji, or OpenIconic sprites, because the engine fetches those on demand and there is nothing to fetch offline
- cannot render diagrams larger than 8192 pixels on a side
- is a fixed PlantUML version, shipped with the plugin, so syntax newer than that version renders on the server backends but not on this one


## Installation
`Settings > Community plugins > Community Plugins > Browse` and search for `PlantUML`.

