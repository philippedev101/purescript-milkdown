module Milkdown.Crepe
  ( Editor
  , MilkdownPlugin
  , EditorConfig
  , Feature(..)
  , create
  , destroy
  , getMarkdown
  , setMarkdown
  , setReadonly
  , focus
  , onMarkdownUpdated
  , onFocus
  , onBlur
  ) where

import Prelude

import Data.Function.Uncurried (Fn2, runFn2)
import Effect (Effect)
import Effect.Aff (Aff)
import Effect.Aff.Compat (EffectFnAff, fromEffectFnAff)
import Web.DOM (Element)

-- | Opaque type for the Crepe editor instance
foreign import data Editor :: Type

-- | Opaque type for a Milkdown plugin (built in JS by the consumer)
foreign import data MilkdownPlugin :: Type

-- | Configuration for creating an editor
type EditorConfig =
  { root :: Element
  , defaultValue :: String
  , readonly :: Boolean
  , features :: Array Feature
  , plugins :: Array MilkdownPlugin
  }

-- | Milkdown Crepe features that can be enabled/disabled
data Feature
  = CodeMirror
  | ListItem
  | LinkTooltip
  | Cursor
  | ImageBlock
  | BlockEdit
  | Toolbar
  | Placeholder
  | Table
  | Latex

featureToString :: Feature -> String
featureToString = case _ of
  CodeMirror -> "CodeMirror"
  ListItem -> "ListItem"
  LinkTooltip -> "LinkTooltip"
  Cursor -> "Cursor"
  ImageBlock -> "ImageBlock"
  BlockEdit -> "BlockEdit"
  Toolbar -> "Toolbar"
  Placeholder -> "Placeholder"
  Table -> "Table"
  Latex -> "Latex"

foreign import _create :: Array String -> EditorConfig -> EffectFnAff Editor

-- | Create and mount a Crepe editor. Returns Aff because Crepe.create() is async.
create :: EditorConfig -> Aff Editor
create config = fromEffectFnAff (_create (map featureToString config.features) config)

foreign import _destroy :: Editor -> Effect Unit

-- | Destroy and unmount the editor.
destroy :: Editor -> Effect Unit
destroy = _destroy

foreign import _getMarkdown :: Editor -> Effect String

-- | Get the current markdown content.
getMarkdown :: Editor -> Effect String
getMarkdown = _getMarkdown

foreign import _setMarkdown :: Fn2 Editor String (Effect Unit)

-- | Replace editor content with new markdown.
setMarkdown :: Editor -> String -> Effect Unit
setMarkdown editor md = runFn2 _setMarkdown editor md

foreign import _setReadonly :: Fn2 Editor Boolean (Effect Unit)

-- | Toggle read-only mode.
setReadonly :: Editor -> Boolean -> Effect Unit
setReadonly editor value = runFn2 _setReadonly editor value

foreign import _focus :: Editor -> Effect Unit

-- | Programmatically focus the editor.
focus :: Editor -> Effect Unit
focus = _focus

foreign import _onMarkdownUpdated :: Fn2 Editor (String -> Effect Unit) (Effect Unit)

-- | Register a callback for markdown content changes.
onMarkdownUpdated :: Editor -> (String -> Effect Unit) -> Effect Unit
onMarkdownUpdated editor cb = runFn2 _onMarkdownUpdated editor cb

foreign import _onFocus :: Fn2 Editor (Effect Unit) (Effect Unit)

-- | Register a focus callback.
onFocus :: Editor -> Effect Unit -> Effect Unit
onFocus editor cb = runFn2 _onFocus editor cb

foreign import _onBlur :: Fn2 Editor (Effect Unit) (Effect Unit)

-- | Register a blur callback.
onBlur :: Editor -> Effect Unit -> Effect Unit
onBlur editor cb = runFn2 _onBlur editor cb
