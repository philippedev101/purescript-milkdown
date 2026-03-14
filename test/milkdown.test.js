import { describe, test, expect, mock, beforeAll } from "bun:test";

// Mock @milkdown/crepe before importing the FFI
mock.module("@milkdown/crepe", () => ({
  Crepe: class MockCrepe {
    constructor(config) {
      this._config = config;
      this._markdown = config.defaultValue || "";
      this._readonly = false;
      this._plugins = [];
      this._listeners = { markdownUpdated: [], focus: [], blur: [] };
      this.editor = {
        use: (plugin) => this._plugins.push(plugin),
        action: (fn) => fn(this),
      };
    }
    async create() {}
    destroy() {
      this._destroyed = true;
    }
    getMarkdown() {
      return this._markdown;
    }
    setReadonly(v) {
      this._readonly = v;
    }
    on(cb) {
      const listener = {
        markdownUpdated: (fn) => this._listeners.markdownUpdated.push(fn),
        focus: (fn) => this._listeners.focus.push(fn),
        blur: (fn) => this._listeners.blur.push(fn),
      };
      cb(listener);
    }
  },
  CrepeFeature: {
    CodeMirror: "code-mirror",
    ListItem: "list-item",
    LinkTooltip: "link-tooltip",
    Cursor: "cursor",
    ImageBlock: "image-block",
    BlockEdit: "block-edit",
    Toolbar: "toolbar",
    Placeholder: "placeholder",
    Table: "table",
    Latex: "latex",
  },
}));

mock.module("@milkdown/kit/utils", () => ({
  replaceAll: (md) => (editor) => {
    editor._markdown = md;
  },
}));

// CSS imports are handled by bun (no-op)

const {
  _create,
  _destroy,
  _getMarkdown,
  _setMarkdown,
  _setReadonly,
  _onMarkdownUpdated,
  _onFocus,
  _onBlur,
} = await import("../src/Milkdown/Crepe.js");

function createEditor(opts = {}) {
  const root = { tagName: "DIV" };
  return new Promise((resolve, reject) => {
    _create(opts.features || [])(
      {
        root,
        defaultValue: opts.defaultValue || "# Hello",
        readonly: opts.readonly || false,
        features: [],
        plugins: opts.plugins || [],
      },
    )(reject, resolve);
  });
}

describe("create", () => {
  test("creates an editor with default value", async () => {
    const editor = await createEditor({ defaultValue: "# Test" });
    expect(editor).toBeDefined();
    expect(editor.getMarkdown()).toBe("# Test");
  });

  test("sets readonly when config.readonly is true", async () => {
    const editor = await createEditor({ readonly: true });
    expect(editor._readonly).toBe(true);
  });

  test("enables requested features and disables others", async () => {
    const editor = await createEditor({ features: ["CodeMirror", "Table"] });
    const features = editor._config.features;
    expect(features["code-mirror"]).toBe(true);
    expect(features["table"]).toBe(true);
    expect(features["list-item"]).toBe(false);
    expect(features["toolbar"]).toBe(false);
  });

  test("registers plugins via editor.use", async () => {
    const plugin1 = { id: "plugin1" };
    const plugin2 = { id: "plugin2" };
    const editor = await createEditor({ plugins: [plugin1, plugin2] });
    expect(editor._plugins).toEqual([plugin1, plugin2]);
  });
});

describe("destroy", () => {
  test("calls destroy on the editor", async () => {
    const editor = await createEditor();
    _destroy(editor)();
    expect(editor._destroyed).toBe(true);
  });
});

describe("getMarkdown", () => {
  test("returns current markdown content", async () => {
    const editor = await createEditor({ defaultValue: "# Hello\n\nWorld" });
    const md = _getMarkdown(editor)();
    expect(md).toBe("# Hello\n\nWorld");
  });
});

describe("setMarkdown", () => {
  test("replaces editor content via replaceAll action", async () => {
    const editor = await createEditor({ defaultValue: "# Old" });
    _setMarkdown(editor, "# New")();
    const md = _getMarkdown(editor)();
    expect(md).toBe("# New");
  });
});

describe("setReadonly", () => {
  test("sets readonly to true", async () => {
    const editor = await createEditor();
    _setReadonly(editor, true)();
    expect(editor._readonly).toBe(true);
  });

  test("sets readonly to false", async () => {
    const editor = await createEditor({ readonly: true });
    _setReadonly(editor, false)();
    expect(editor._readonly).toBe(false);
  });
});

describe("onMarkdownUpdated", () => {
  test("registers a listener for markdown changes", async () => {
    const editor = await createEditor();
    let received = null;
    _onMarkdownUpdated(editor, (md) => () => {
      received = md;
    })();

    expect(editor._listeners.markdownUpdated.length).toBe(1);

    // Simulate the callback
    editor._listeners.markdownUpdated[0]({}, "# Updated", "# Old");
    expect(received).toBe("# Updated");
  });
});

describe("onFocus", () => {
  test("registers a focus listener", async () => {
    const editor = await createEditor();
    let focused = false;
    _onFocus(editor, () => {
      focused = true;
    })();

    expect(editor._listeners.focus.length).toBe(1);

    // Simulate focus
    editor._listeners.focus[0]({});
    expect(focused).toBe(true);
  });
});

describe("onBlur", () => {
  test("registers a blur listener", async () => {
    const editor = await createEditor();
    let blurred = false;
    _onBlur(editor, () => {
      blurred = true;
    })();

    expect(editor._listeners.blur.length).toBe(1);

    // Simulate blur
    editor._listeners.blur[0]({});
    expect(blurred).toBe(true);
  });
});
