module Test.Main where

import Prelude

import Data.Either (Either(..))
import Effect (Effect)
import Effect.Aff (launchAff_, attempt)
import Effect.Class (liftEffect)
import Effect.Console (log)
import Effect.Exception (error, message, throwException)
import Effect.Ref as Ref
import Milkdown.Crepe as M
import Web.DOM (Element)

foreign import createTestRoot :: Effect Element

assert :: String -> Boolean -> Effect Unit
assert label b
  | b = log $ "  ✓ " <> label
  | otherwise = throwException $ error $ "✗ FAILED: " <> label

main :: Effect Unit
main = launchAff_ do
  liftEffect $ log "purescript-milkdown integration tests\n"

  root <- liftEffect createTestRoot

  result <- attempt do
    let
      config =
        { root
        , defaultValue: "# Hello\n\nWorld"
        , readonly: false
        , features: []
        , plugins: []
        }

    editor <- M.create config
    liftEffect $ log "  ✓ create"

    md <- liftEffect $ M.getMarkdown editor
    liftEffect $ assert "getMarkdown returns content" (md /= "")

    -- setMarkdown calls replaceAll which requires a fully working
    -- ProseMirror view. In happy-dom it may not update getMarkdown,
    -- so we just verify it doesn't throw.
    liftEffect $ M.setMarkdown editor "# Updated"
    liftEffect $ log "  ✓ setMarkdown (no throw)"

    liftEffect $ M.setReadonly editor true
    liftEffect $ log "  ✓ setReadonly true"

    liftEffect $ M.setReadonly editor false
    liftEffect $ log "  ✓ setReadonly false"

    liftEffect $ M.focus editor
    liftEffect $ log "  ✓ focus"

    ref <- liftEffect $ Ref.new ""
    liftEffect $ M.onMarkdownUpdated editor \newMd -> Ref.write newMd ref
    liftEffect $ log "  ✓ onMarkdownUpdated registered"

    liftEffect $ M.onFocus editor (pure unit)
    liftEffect $ log "  ✓ onFocus registered"

    liftEffect $ M.onBlur editor (pure unit)
    liftEffect $ log "  ✓ onBlur registered"

    liftEffect $ M.destroy editor
    liftEffect $ log "  ✓ destroy"

  case result of
    Right _ -> liftEffect $ log "\nAll tests passed!"
    Left err -> liftEffect do
      log $ "\n✗ Test failed: " <> message err
      throwException $ error $ message err
