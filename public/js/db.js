// TODO: setup indexedDb connection and create an object store for saving
// transaction data when the user is offline.
let db;
const request = window.indexedDB.open("budget-db", 1);

request.onerror = function (evt) {
  console.log(`Woops!⛔ ${evt.target.errorCode}`);
};

request.onupgradeneeded = function (evt) {
  db = evt.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onsuccess = function (evt) {
  console.log("open budget-db success 🔌");
  db = evt.target.result;

  if (navigator.online) {
    console.log("Online! 🌐");
    checkDatabase();
  }
};

function saveRecord(record) {
  // TODO: this function should save a transaction object to indexedDB so that
  // it can be synced with the database when the user goes back online.
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const budgetStore = transaction.objectStoreNames("BudgetStore");
  budgetStore.add(record);
}

function checkDatabase() {
  // TODO: this function should check for any saved transactions and post them
  // all to the database. Delete the transactions from IndexedDB if the post
  // request is successful.
  const transaction = db.transaction(["BudgetStore"], "readonly");
  const budgetStore = transaction.objectStore("BudgetStore");
  const getAll = budgetStore.getAll();

  getAll.onsuccess = async () => {
    if (getAll.result.length === 0) return;

    const response = await fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    });

    const dbTransactions = await response.json();

    if (dbTransactions.length > 0) {
      const newTransaction = db.transaction(["BudgetStore"], "readwrite");
      const newBudgetStore = newTransaction.objectStore("BudgetStore");
      newBudgetStore.clear();
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
