# purescript-milkdown

PureScript FFI bindings for [Milkdown](https://milkdown.dev/) (Crepe API).

This library wraps the [Crepe](https://milkdown.dev/docs/guide/using-crepe) high-level API. It does not cover the lower-level Milkdown editor API, ProseMirror internals, or feature-specific configuration (e.g. configuring the toolbar items or placeholder text). Custom plugins can be passed in as opaque values built in JS.

## What's included

- Editor lifecycle (`create`, `destroy`)
- Reading and writing markdown content
- Toggling read-only mode
- Enabling/disabling Crepe features (toolbar, code mirror, tables, etc.)
- Event callbacks (markdown changes, focus, blur)
- Passing custom Milkdown plugins
- Crepe theme CSS (frame light) auto-imported

## What's not included

- Feature-specific configuration (e.g. toolbar items, placeholder text, image upload handlers)
- The lower-level `@milkdown/kit` editor API
- ProseMirror commands and node/mark access
- The `updated` event (doc-level, as opposed to `markdownUpdated`)
- Programmatic blur (only `focus` and callbacks are exposed)
- Theme switching at runtime (dark theme CSS must be imported by the consumer)

## Installation

```
spago install milkdown
bun add @milkdown/crepe @milkdown/kit
```

## Usage

```purescript
module Main where

import Prelude
import Effect (Effect)
import Effect.Aff (launchAff_)
import Effect.Class (liftEffect)
import Milkdown.Crepe as M

main :: Effect Unit
main = launchAff_ do
  editor <- M.create
    { root: myElement
    , defaultValue: "# Hello, Milkdown!"
    , readonly: false
    , features: [ M.Toolbar, M.ListItem, M.Table ]
    , plugins: []
    }

  liftEffect do
    md <- M.getMarkdown editor
    M.onMarkdownUpdated editor \newMarkdown -> pure unit
```

## API

```purescript
-- Lifecycle
create      :: EditorConfig -> Aff Editor
destroy     :: Editor -> Effect Unit

-- Content
getMarkdown :: Editor -> Effect String
setMarkdown :: Editor -> String -> Effect Unit

-- Mode
setReadonly  :: Editor -> Boolean -> Effect Unit

-- Focus
focus         :: Editor -> Effect Unit

-- Events
onMarkdownUpdated :: Editor -> (String -> Effect Unit) -> Effect Unit
onFocus           :: Editor -> Effect Unit -> Effect Unit
onBlur            :: Editor -> Effect Unit -> Effect Unit
```

### EditorConfig

```purescript
type EditorConfig =
  { root         :: Element          -- DOM element to mount into
  , defaultValue :: String           -- Initial markdown content
  , readonly     :: Boolean          -- Start in read-only mode
  , features     :: Array Feature    -- Crepe features to enable
  , plugins      :: Array MilkdownPlugin  -- Additional Milkdown plugins
  }
```

### Features

All [Crepe features](https://milkdown.dev/docs/guide/using-crepe) are supported: `CodeMirror`, `ListItem`, `LinkTooltip`, `Cursor`, `ImageBlock`, `BlockEdit`, `Toolbar`, `Placeholder`, `Table`, `Latex`.

Features not listed in the array are disabled.

### Custom plugins

Pass custom Milkdown plugins via the `plugins` field. Define them in your own JS FFI using Milkdown's composable plugin API (`$node`, `$inputRule`, `$command` from `@milkdown/kit/utils`):

```purescript
foreign import myPlugin :: MilkdownPlugin
```

```javascript
import { $node } from "@milkdown/kit/utils";
export const myPlugin = $node("custom", () => ({ /* ... */ }));
```

## Theming

The library imports `@milkdown/crepe/theme/common/style.css` and `@milkdown/crepe/theme/frame.css` automatically. For dark mode, import `@milkdown/crepe/theme/frame-dark.css` in your application.

## License

Apache-2.0
