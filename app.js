(() => {
  const STORAGE_KEY = "tick-todos-v1";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const empty = document.getElementById("empty-state");
  const countEl = document.getElementById("todo-count");
  const clearDoneBtn = document.getElementById("clear-done");
  const filterButtons = [...document.querySelectorAll(".filter")];

  /** @type {{ id: string, text: string, done: boolean, createdAt: number }[]} */
  let todos = loadTodos();
  let filter = "all";

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
    persist();
    render();
    input.focus();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter || "all";
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      render();
    });
  });

  clearDoneBtn.addEventListener("click", () => {
    todos = todos.filter((todo) => !todo.done);
    persist();
    render();
  });

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const item = target.closest(".todo-item");
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;

    if (target.closest(".check")) {
      todos = todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      );
      persist();
      render();
      return;
    }

    if (target.closest(".delete-btn")) {
      item.classList.add("is-leaving");
      window.setTimeout(() => {
        todos = todos.filter((todo) => todo.id !== id);
        persist();
        render();
      }, 180);
    }
  });

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return sampleTodos();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return sampleTodos();
      return parsed
        .filter((item) => item && typeof item.text === "string")
        .map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          text: String(item.text).slice(0, 120),
          done: Boolean(item.done),
          createdAt: Number(item.createdAt) || Date.now(),
        }));
    } catch {
      return sampleTodos();
    }
  }

  function sampleTodos() {
    return [
      {
        id: crypto.randomUUID(),
        text: "打开 Tick，体验添加待办",
        done: false,
        createdAt: Date.now() - 3000,
      },
      {
        id: crypto.randomUUID(),
        text: "勾选完成一项任务",
        done: false,
        createdAt: Date.now() - 2000,
      },
      {
        id: crypto.randomUUID(),
        text: "试试筛选与清除已完成",
        done: true,
        createdAt: Date.now() - 1000,
      },
    ];
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((todo) => !todo.done);
    if (filter === "done") return todos.filter((todo) => todo.done);
    return todos;
  }

  function render() {
    const visible = visibleTodos();
    const activeCount = todos.filter((todo) => !todo.done).length;
    const doneCount = todos.length - activeCount;

    countEl.textContent =
      filter === "done"
        ? `${doneCount} 项已完成`
        : filter === "active"
          ? `${activeCount} 项进行中`
          : `${todos.length} 项待办`;

    clearDoneBtn.hidden = doneCount === 0;
    empty.hidden = visible.length > 0;
    list.innerHTML = "";

    const fragment = document.createDocumentFragment();
    visible.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.done ? " is-done" : ""}`;
      li.dataset.id = todo.id;
      li.innerHTML = `
        <button type="button" class="check" aria-label="${todo.done ? "标记为未完成" : "标记为已完成"}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <p class="todo-text"></p>
        <button type="button" class="delete-btn" aria-label="删除待办">×</button>
      `;
      li.querySelector(".todo-text").textContent = todo.text;
      fragment.appendChild(li);
    });
    list.appendChild(fragment);
  }

  persist();
  render();
})();
