// ▼▼▼▼▼ GASのURL（変更不要） ▼▼▼▼▼
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWEhThIS13xqaFqMIESmZh5L3VsiY4oAuhgFaCxYvYqbvMruQM921ZBQ1_rAv5BzYRSw/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- グローバル変数 ---
let currentLoginName = "";
const LOGIN_STORAGE_KEY = "vcrp_app_login_name";

// --- DOM要素の取得 ---
// 画面
const loginScreen = document.getElementById("loginScreen");
const mainScreen = document.getElementById("mainScreen");

// ログイン画面
const loginForm = document.getElementById("loginForm");
const loginNameSelect = document.getElementById("loginNameSelect");
const loginErrorMessage = document.getElementById("loginErrorMessage");

// メイン画面
const picksForm = document.getElementById("picksForm");
const picksInput = document.getElementById("picksInput");
const submitButton = document.getElementById("submitButton");
const rankingList = document.getElementById("rankingList");
const errorMessage = document.getElementById("errorMessage");
const currentUserName = document.getElementById("currentUserName");
const logoutButton = document.getElementById("logoutButton");
const resetButton = document.getElementById("resetButton");
const quickAddButtons = document.querySelectorAll(".quick-add-btn");

// タブ関連のDOM取得
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// --- 起動時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. アプリ起動時に初期データをGASから取得
    fetchInitialData();

    // 2. ログインフォームのイベント
    loginForm.addEventListener("submit", handleLogin);
    
    // 3. ピック数送信フォームのイベント
    picksForm.addEventListener("submit", handleSubmit);
    
    // 4. ログアウトボタンのイベント
    logoutButton.addEventListener("click", handleLogout);

    // 5. クイック追加ボタンのイベント
    quickAddButtons.forEach(button => {
        button.addEventListener("click", handleQuickAdd);
    });
    
    // 6. リセットボタンのイベント
    resetButton.addEventListener("click", handleReset);

    // 7. タブ切り替えのイベント
    tabButtons.forEach(button => {
        button.addEventListener("click", handleTabClick);
    });
});

/**
 * 1. アプリ起動時に初期データをGASから取得
 * ★★★ この関数を修正 ★★★
 */
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        const data = result.data;
        updateNameSelect(data.names);
        updateRanking(data.ranking); // ランキングは裏で更新しておく

    } catch (error) { 
        showError("初期データの読み込みに失敗しました: " + error.message, "login");
        showError("初期データの読み込みに失敗しました: " + error.message, "main");
    } finally {
        // ★★★ 失敗しても成功しても、必ず画面切り替え処理を呼ぶ ★★★
        checkLoginStatus();
    }
}

/**
 * 1-3. ログイン状態をチェックし、画面を切り替える
 */
function checkLoginStatus() {
    const savedName = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (savedName) {
        currentLoginName = savedName;
        currentUserName.textContent = savedName;
        showMainScreen();
    } else {
        showLoginScreen();
    }
}

/**
 * 2. ログイン処理
 */
function handleLogin(e) {
    e.preventDefault();
    const selectedName = loginNameSelect.value;

    if (!selectedName) {
        showError("名前を選択してください。", "login");
        return;
    }
    currentLoginName = selectedName;
    localStorage.setItem(LOGIN_STORAGE_KEY, selectedName);
    currentUserName.textContent = selectedName;
    showMainScreen();
}

/**
 * 3. フォーム送信（ピック数送信）の処理
 */
async function handleSubmit(e) {
    e.preventDefault();
    const picks = picksInput.value;

    if (!currentLoginName) {
        showError("ログイン情報がありません。再度ログインしてください。", "main");
        handleLogout();
        return;
    }
    
    if (!picks || parseInt(picks, 10) <= 0) {
        showError("ピック数は1以上の数値を入力してください。", "main");
        return;
    }
    
    setLoading(true);

    try {
        const postData = {
            name: currentLoginName,
            picks: picks
        };
        
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(postData), 
        });

        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        picksInput.value = "";
        updateRanking(result.data);

    } catch (error) {
        showError("送信に失敗しました: " + error.message, "main");
    } finally {
        setLoading(false);
    }
}

/**
 * 4. ログアウト処理
 */
function handleLogout() {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    currentLoginName = "";
    showLoginScreen();
}

/**
 * 5. ピック数クイック追加
 */
function handleQuickAdd(e) {
    const valueToAdd = parseInt(e.target.dataset.value, 10);
    const currentPicks = parseInt(picksInput.value, 10);
    if (isNaN(currentPicks)) {
        picksInput.value = valueToAdd;
    } else {
        picksInput.value = currentPicks + valueToAdd;
    }
}

/**
 * 6. リセット処理
 */
function handleReset() {
    picksInput.value = "";
    showError("", "main");
}

/**
 * 7. タブ切り替え処理
 */
function handleTabClick(e) {
    const clickedTab = e.currentTarget.dataset.tab;

    tabButtons.forEach(btn => {
        btn.classList.remove("active");
    });
    e.currentTarget.classList.add("active");

    tabContents.forEach(content => {
        content.classList.remove("active");
    });
    
    const contentToShow = document.getElementById(clickedTab + "TabContent");
    contentToShow.classList.add("active");
    
    if (clickedTab === 'ranking') {
        showError("", "main");
    }
}


// --- 画面更新用のヘルパー関数 ---

function updateNameSelect(names) {
    loginNameSelect.innerHTML = "";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "名前を選んでください";
    loginNameSelect.appendChild(defaultOption);

    names.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        loginNameSelect.appendChild(option);
    });
}

function updateRanking(rankingData) {
    rankingList.innerHTML = "";

    if (!rankingData || rankingData.length === 0) {
        rankingList.innerHTML = "<li>データがありません</li>";
        return;
    }

    const top3 = rankingData.slice(0, 3);

    top3.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `${item.name} <span>${item.picks} ピック</span>`;
        rankingList.appendChild(li);
    });
}

// 画面切り替え
function showLoginScreen() {
    loginScreen.classList.remove("hidden");
    mainScreen.classList.add("hidden");
}

function showMainScreen() {
    loginScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    
    tabButtons.forEach(btn => btn.classList.remove("active"));
    document.querySelector('.tab-btn[data-tab="input"]').classList.add("active");

    tabContents.forEach(content => content.classList.remove("active"));
    document.getElementById("inputTabContent").classList.add("active");

    showError("", "main");
    picksInput.value = "";
}

function setLoading(isLoading) {
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = "送信中...";
        errorMessage.classList.add("hidden");
    } else {
        submitButton.disabled = false;
        submitButton.textContent = "送信";
    }
}

function showError(message, type) {
    const element = (type === "login") ? loginErrorMessage : errorMessage;
    if (message) {
        element.textContent = "※ " + message;
        element.classList.remove("hidden");
    } else {
        element.textContent = "";
        element.classList.add("hidden");
    }
}