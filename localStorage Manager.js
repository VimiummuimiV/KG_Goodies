// ==UserScript==
// @name         LocalStorage Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Manage localStorage
// @author       Patcher
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #ls-manager-btn {
            position: fixed; bottom: 30px; right: 5px; width: 50px; height: 50px;
            background: #1976d2; border-radius: 50%; display: flex; align-items: center;
            justify-content: center; cursor: pointer; z-index: 10000; font-size: 20px;
            box-shadow: 0 4px 12px rgba(25,118,210,0.4); transition: all 0.3s ease;
            user-select: none; color: white; border: none;
        }
        #ls-manager-btn:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(25,118,210,0.6); }

        #ls-manager-modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: none; z-index: 10001; backdrop-filter: blur(5px);
        }

        .ls-container {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
            width: 90%; max-width: 700px; max-height: 80vh; background: #1e1e1e;
            border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .ls-header {
            background: #2d2d2d; padding: 12px 20px; display: flex;
            justify-content: space-between; align-items: center; border-bottom: 1px solid #333;
        }
        .ls-header h2 { color: #fff; margin: 0; font-size: 18px; font-weight: 500; }

        .ls-controls { padding: 12px 20px; background: #252525; border-bottom: 1px solid #333; }
        .ls-input-row { display: flex; gap: 8px; margin-bottom: 8px; }

        .ls-input {
            padding: 8px 10px; background: #1e1e1e; border: 1px solid #404040;
            border-radius: 4px; color: #fff; outline: none; font-family: inherit;
        }
        .ls-input:focus { border-color: #1976d2; }
        .ls-input[type="text"] { flex: 1; }

        .ls-textarea {
            width: 100%; height: 60px; padding: 8px 10px; background: #1e1e1e;
            border: 1px solid #404040; border-radius: 4px; color: #fff; outline: none;
            resize: vertical; font-family: 'Consolas', Monaco, monospace; box-sizing: border-box;
        }
        .ls-textarea:focus { border-color: #1976d2; }

        .ls-btn {
            padding: 8px 16px; border: none; border-radius: 4px; color: white;
            cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.2s;
        }
        .ls-btn-primary { background: #4caf50; }
        .ls-btn-primary:hover { background: #45a049; }
        .ls-btn-secondary { background: #2196f3; }
        .ls-btn-secondary:hover { background: #1976d2; }
        .ls-btn-warning { background: #ff9800; }
        .ls-btn-warning:hover { background: #f57c00; }
        .ls-btn-danger { background: #f44336; }
        .ls-btn-danger:hover { background: #d32f2f; }
        .ls-btn-close { background: none; font-size: 20px; padding: 4px 8px; }
        .ls-btn-close:hover { background: #424242; }

        .ls-search { padding: 10px 20px; background: #252525; border-bottom: 1px solid #333; }

        .ls-data { flex: 1; overflow-y: auto; padding: 12px 0; }
        .ls-empty { text-align: center; color: #888; padding: 30px; }

        .ls-item {
            margin: 0 20px 8px; background: #2a2a2a; border-radius: 6px;
            border: 1px solid #404040; overflow: hidden; transition: all 0.2s;
        }
        .ls-item:hover { border-color: #555; background: #2f2f2f; }

        .ls-item-header {
            padding: 8px 12px; display: flex; justify-content: space-between;
            align-items: center; background: #323232; border-bottom: 1px solid #404040;
        }
        .ls-item-key {
            color: #4fc3f7; font-family: 'Consolas', Monaco, monospace;
            word-break: break-all; margin-right: 12px; font-size: 13px;
        }
        .ls-item-actions { display: flex; gap: 6px; }
        .ls-item-btn { padding: 4px 8px; font-size: 11px; }

        .ls-item-value {
            padding: 8px 12px; color: #e0e0e0; font-family: 'Consolas', Monaco, monospace;
            font-size: 12px; word-break: break-all; white-space: pre-wrap;
            max-height: 120px; overflow-y: auto; line-height: 1.3;
        }

        .ls-footer {
            padding: 8px 20px; background: #2d2d2d; border-top: 1px solid #333;
            text-align: center; color: #888; font-size: 11px;
        }
    `;
    document.head.appendChild(style);

    // Create floating button
    const btn = document.createElement('button');
    btn.id = 'ls-manager-btn';
    btn.innerHTML = '🗃️';
    btn.type = 'button';
    document.body.appendChild(btn);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'ls-manager-modal';
    document.body.appendChild(modal);

    // Create container
    const container = document.createElement('div');
    container.className = 'ls-container';
    modal.appendChild(container);

    // Header
    const header = document.createElement('div');
    header.className = 'ls-header';
    const title = document.createElement('h2');
    title.textContent = 'LocalStorage Manager';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ls-btn ls-btn-close';
    closeBtn.innerHTML = '×';
    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'ls-controls';

    const inputRow = document.createElement('div');
    inputRow.className = 'ls-input-row';
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'ls-input';
    keyInput.placeholder = 'Key';
    keyInput.autocomplete = 'off';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ls-btn ls-btn-primary';
    addBtn.textContent = 'Add';
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'ls-btn ls-btn-secondary';
    refreshBtn.textContent = 'Refresh';
    inputRow.appendChild(keyInput);
    inputRow.appendChild(addBtn);
    inputRow.appendChild(refreshBtn);

    const valueInput = document.createElement('textarea');
    valueInput.className = 'ls-textarea';
    valueInput.placeholder = 'Value';
    valueInput.autocomplete = 'off';

    controls.appendChild(inputRow);
    controls.appendChild(valueInput);
    container.appendChild(controls);

    // Search
    const searchDiv = document.createElement('div');
    searchDiv.className = 'ls-search';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'ls-input';
    searchInput.placeholder = 'Search keys...';
    searchInput.autocomplete = 'off';
    searchDiv.appendChild(searchInput);
    container.appendChild(searchDiv);

    // Data container
    const dataContainer = document.createElement('div');
    dataContainer.className = 'ls-data';
    container.appendChild(dataContainer);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ls-footer';
    const countSpan = document.createElement('span');
    countSpan.textContent = '0 items';
    footer.appendChild(countSpan);
    container.appendChild(footer);

    // State
    let editingKey = null;

    // Functions
    function openModal() {
        modal.style.display = 'block';
        refreshData();
    }

    function closeModal() {
        modal.style.display = 'none';
        clearInputs();
    }

    function clearInputs() {
        keyInput.value = '';
        valueInput.value = '';
        addBtn.textContent = 'Add';
        addBtn.className = 'ls-btn ls-btn-primary';
        editingKey = null;
    }

    function refreshData() {
        const term = searchInput.value.toLowerCase();
        const keys = Object.keys(localStorage).filter(k => k.toLowerCase().includes(term));

        dataContainer.innerHTML = '';
        countSpan.textContent = `${keys.length} items`;

        if (!keys.length) {
            const empty = document.createElement('div');
            empty.className = 'ls-empty';
            empty.textContent = 'No items found';
            dataContainer.appendChild(empty);
            return;
        }

        keys.forEach(key => {
            const item = document.createElement('div');
            item.className = 'ls-item';

            const itemHeader = document.createElement('div');
            itemHeader.className = 'ls-item-header';

            const itemKey = document.createElement('strong');
            itemKey.className = 'ls-item-key';
            itemKey.textContent = key;

            const actions = document.createElement('div');
            actions.className = 'ls-item-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'ls-btn ls-btn-warning ls-item-btn';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => editItem(key);

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'ls-btn ls-btn-danger ls-item-btn';
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => deleteItem(key);

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            itemHeader.appendChild(itemKey);
            itemHeader.appendChild(actions);

            const itemValue = document.createElement('div');
            itemValue.className = 'ls-item-value';
            itemValue.textContent = localStorage.getItem(key);

            item.appendChild(itemHeader);
            item.appendChild(itemValue);
            dataContainer.appendChild(item);
        });
    }

    function addOrUpdate() {
        const key = keyInput.value.trim();
        if (!key) return alert('Enter a key');

        if (editingKey && editingKey !== key) localStorage.removeItem(editingKey);
        localStorage.setItem(key, valueInput.value);
        refreshData();
        clearInputs();
    }

    function editItem(key) {
        editingKey = key;
        keyInput.value = key;
        valueInput.value = localStorage.getItem(key) || '';
        addBtn.textContent = 'Update';
        addBtn.className = 'ls-btn ls-btn-warning';
    }

    function deleteItem(key) {
        if (confirm(`Delete "${key}"?`)) {
            localStorage.removeItem(key);
            refreshData();
            if (editingKey === key) clearInputs();
        }
    }

    // Events
    btn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    addBtn.addEventListener('click', addOrUpdate);
    refreshBtn.addEventListener('click', refreshData);
    searchInput.addEventListener('input', refreshData);
    modal.addEventListener('click', e => e.target === modal && closeModal());

    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'l') { e.preventDefault(); openModal(); }
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });
    keyInput.addEventListener('keydown', e => e.key === 'Enter' && valueInput.focus());
    valueInput.addEventListener('keydown', e => e.ctrlKey && e.key === 'Enter' && addOrUpdate());

})();