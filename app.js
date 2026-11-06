(() => {
  const STORAGE_KEY = "inklist.todos.v1";

  /** @typedef {{ id: string, text: string, done: boolean, createdAt: number }} Todo */

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const listEl = document.getElementById("todo-list");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("todo-count");
  const clearDoneBtn = document.getElementById("clear-done");
  const filterButtons = [...document.querySelectorAll(".filter")];

  /** @type {Todo[]} */
  let todos = loadTodos();
  /** @type {"all" | "active" | "done"} */
  let filter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedTodos();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return seedTodos();
      return parsed
        .filter((t) => t && typeof t.text === "string")
        .map((t) => ({
          id: String(t.id ?? crypto.randomUUID()),
          text: String(t.text).slice(0, 120),
          done: Boolean(t.done),
          createdAt: Number(t.createdAt) || Date.now(),
        }));
    } catch {
      return seedTodos();
    }
  }

  function seedTodos() {
    const now = Date.now();
    return [
      { id: crypto.randomUUID(), text: "打开 Inklist，看看这个 demo", done: true, createdAt: now - 3000 },
      { id: crypto.randomUUID(), text: "添加一件今天真正要做的事", done: false, createdAt: now - 2000 },
      { id: crypto.randomUUID(), text: "完成后勾选，感受一下流畅交互", done: false, createdAt: now - 1000 },
    ];
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "done") return todos.filter((t) => t.done);
    return todos;
  }

  function render() {
    const visible = visibleTodos();
    const activeCount = todos.filter((t) => !t.done).length;
    const doneCount = todos.length - activeCount;

    countEl.textContent =
      filter === "done"
        ? `${doneCount} 项已完成`
        : filter === "active"
          ? `${activeCount} 项进行中`
          : `${activeCount} 项待办 · 共 ${todos.length} 项`;

    clearDoneBtn.hidden = doneCount === 0;

    if (visible.length === 0) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.querySelector(".empty-title").textContent =
        todos.length === 0 ? "清单是空的" : "这一栏暂时没有事项";
      emptyEl.querySelector(".empty-copy").textContent =
        todos.length === 0
          ? "添加第一件事，从这里开始今天。"
          : filter === "done"
            ? "还没有完成的事项。"
            : "进行中的事项都做完了。";
      return;
    }

    emptyEl.hidden = true;
    listEl.innerHTML = visible
      .map(
        (todo) => `
      <li class="todo-item${todo.done ? " is-done" : ""}" data-id="${todo.id}">
        <button
          type="button"
          class="check"
          data-action="toggle"
          aria-label="${todo.done ? "标记为未完成" : "标记为完成"}"
          aria-pressed="${todo.done}"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 8.2 6.4 11.2 12.5 4.8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <p class="todo-text">${escapeHtml(todo.text)}</p>
        <button type="button" class="delete" data-action="delete" aria-label="删除待办">删除</button>
      </li>`
      )
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos = [
      {
        id: crypto.randomUUID(),
        text,
        done: false,
        createdAt: Date.now(),
      },
      ...todos,
    ];
    input.value = "";
    saveTodos();
    render();
    input.focus();
  });

  listEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("[data-action]");
    const item = target.closest(".todo-item");
    if (!button || !item) return;

    const id = item.getAttribute("data-id");
    const action = button.getAttribute("data-action");
    if (!id || !action) return;

    if (action === "toggle") {
      todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    }

    if (action === "delete") {
      todos = todos.filter((t) => t.id !== id);
    }

    saveTodos();
    render();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filter = /** @type {"all" | "active" | "done"} */ (button.dataset.filter || "all");
      filterButtons.forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      render();
    });
  });

  clearDoneBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    saveTodos();
    render();
  });

  render();
  input.focus();
})();
