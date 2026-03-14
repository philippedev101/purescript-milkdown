import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

const featureMap = {
  CodeMirror: CrepeFeature.CodeMirror,
  ListItem: CrepeFeature.ListItem,
  LinkTooltip: CrepeFeature.LinkTooltip,
  Cursor: CrepeFeature.Cursor,
  ImageBlock: CrepeFeature.ImageBlock,
  BlockEdit: CrepeFeature.BlockEdit,
  Toolbar: CrepeFeature.Toolbar,
  Placeholder: CrepeFeature.Placeholder,
  Table: CrepeFeature.Table,
  Latex: CrepeFeature.Latex,
};

// create :: Array String -> EditorConfig -> EffectFnAff Editor
export const _create = (featureStrings) => (config) => (onError, onSuccess) => {
  const features = {};
  Object.values(CrepeFeature).forEach((f) => (features[f] = false));
  featureStrings.forEach((f) => {
    const mapped = featureMap[f];
    if (mapped != null) features[mapped] = true;
  });

  const crepe = new Crepe({
    root: config.root,
    defaultValue: config.defaultValue,
    features,
  });

  config.plugins.forEach((plugin) => {
    crepe.editor.use(plugin);
  });

  crepe
    .create()
    .then(() => {
      if (config.readonly) crepe.setReadonly(true);
      onSuccess(crepe);
    })
    .catch(onError);

  return (cancelError, onCancelerError, onCancelerSuccess) => {
    crepe.destroy();
    onCancelerSuccess();
  };
};

// destroy :: Editor -> Effect Unit
export const _destroy = (editor) => () => editor.destroy();

// getMarkdown :: Editor -> Effect String
export const _getMarkdown = (editor) => () => editor.getMarkdown();

// setMarkdown :: Fn2 Editor String (Effect Unit)
export const _setMarkdown = (editor, md) => () => {
  editor.editor.action(replaceAll(md));
};

// setReadonly :: Fn2 Editor Boolean (Effect Unit)
export const _setReadonly = (editor, value) => () => {
  editor.setReadonly(value);
};

// focus :: Editor -> Effect Unit
export const _focus = (editor) => () => {
  editor.editor.action((ctx) => ctx.get(editorViewCtx).focus());
};

// onMarkdownUpdated :: Fn2 Editor (String -> Effect Unit) (Effect Unit)
export const _onMarkdownUpdated = (editor, callback) => () => {
  editor.on((listener) => {
    listener.markdownUpdated((_ctx, markdown, _prevMarkdown) => {
      callback(markdown)();
    });
  });
};

// onFocus :: Fn2 Editor (Effect Unit) (Effect Unit)
export const _onFocus = (editor, callback) => () => {
  editor.on((listener) => {
    listener.focus(() => callback());
  });
};

// onBlur :: Fn2 Editor (Effect Unit) (Effect Unit)
export const _onBlur = (editor, callback) => () => {
  editor.on((listener) => {
    listener.blur(() => callback());
  });
};
