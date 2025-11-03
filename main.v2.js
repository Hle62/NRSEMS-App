// ▼▼▼▼▼ GASのURL（変更不要） ▼▼▼▼▼
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWEhThIS13xqaFqMIESmZh5L3VsiY4oAuhgFaCxYvYqbvMruQM921ZBQ1_rAv5BzYRSw/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- グローバル変数 ---
let currentLoginName = "";
const LOGIN_STORAGE_KEY = "vcrp_app_login_name";

// --- DOM要素の取得 ---
const loginScreen = document.getElementById("loginScreen");
const mainScreen = document.getElementById("mainScreen");
const loginForm = document.getElementById("loginForm");
const loginNameSelect = document.getElementById("loginNameSelect");
const loginErrorMessage = document.getElementById("loginErrorMessage");
const picksForm = document.getElementById("picksForm");
const picksInput = document.getElementById("picksInput");
const submitButton = document.getElementById("submitButton");
const rankingList = document.getElementById("rankingList");
const errorMessage = document.getElementById("errorMessage");
const currentUserName = document.getElementById("currentUserName");
const logoutButton = document.getElementById("logoutButton");
const resetButton = document.getElementById("resetButton");
const quickAddButtons = document.querySelectorAll(".quick-add-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// --- 起動時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    fetchInitialData();
    loginForm.addEventListener("submit", handleLogin);
    picksForm.addEventListener("submit", handleSubmit);
    logoutButton.addEventListener("click", handleLogout);
    quickAddButtons.forEach(button => {
        button.addEventListener("click", handleQuickAdd);
    });
    resetButton.addEventListener("click", handleReset);
    tabButtons.forEach(button => {
        button.addEventListener("click", handleTabClick);
    });
});

/**
 * 1. アプリ起動時に初期データをGASから取得
 * (変更なし)
 */
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_API_URL); // doGet
        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        const data = result.data; 
        updateNameSelect(data.names);
        updateRanking(data.ranking);

    } catch (error) { 
        showError("初期データの読み込みに失敗しました: " + error.message, "login");
        showError("初期データの読み込みに失敗しました: " + error.message, "main");
    } finally {
        checkLoginStatus();
    }
}

/**
 * 1-3. ログイン状態をチェックし、画面を切り替える
 * (変更なし)
 */
function checkLoginStatus() {
    const savedName = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (savedName) {
        currentLoginName = savedName;
        currentUserName.textContent = savedName;
        showMainScreen();
    } else {
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        showLoginScreen();
    }
}

/**
 * 2. ログイン処理
 * (変更なし)
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
 * ★★★ この関数を修正 ★★★
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
    
    setLoading(true); // 1. 「送信中...」開始 (エラーを隠す)

    try {
        const postData = {
            name: currentLoginName,
            picks: picks
        };
        
        const response = await fetch(GAS_API_URL, {
            method: "POST", // doPost
            mode: "cors",
            body: JSON.stringify(postData), 
        });

        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        // ★ 2. 送信成功！
        picksInput.value = ""; // 入力欄をクリア
        setLoading(false); // ★ 3. 「送信中...」をすぐに解除
        
        // ★ 4. バックグラウンドでランキングを再取得
        // showError("送信完了。ランキングを更新します...", "main"); // ← ★ 削除
        await fetchInitialData(); // doGetを再度呼び出し、ランキングと名前を更新
        // showError("", "main"); // ← ★ 削除 (setLoading(true)で隠れているので不要)

    } catch (error) {
        showError("送信に失敗しました: " + error.message, "main");
        setLoading(false); // ★ エラー時も「送信中」を解除
    }
}

/**
 * 4. ログアウト処理
 * (変更なし)
 */
function handleLogout() {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    currentLoginName = "";
    showLoginScreen();
}

/**
 * 5. ピック数クイック追加
 * (変更なし)
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
 * (変更なし)
 */
function handleReset() {
    picksInput.value = "";
    showError("", "main");
}

/**
 * 7. タブ切り替え処理
 * (変更なし)
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
// (変更なし)
function updateNameSelect(names) {
    loginNameSelect.innerHTML = ""; 
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "名前を選んでください";
    loginNameSelect.appendChild(defaultOption);

    if (names && names.length > 0) {
        names.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            loginNameSelect.appendChild(option);
        });
    }
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
        li.innerHTML = `${item.name} <span>${item.picks} 人</span>`;
        rankingList.appendChild(li);
    });
}

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