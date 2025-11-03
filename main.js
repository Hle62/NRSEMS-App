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

// ★★★ 追加 ★★★
const resetButton = document.getElementById("resetButton");
//
const quickAddButtons = document.querySelectorAll(".quick-add-btn");

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
    
    // ★★★ 追加 ★★★
    // 6. リセットボタンのイベント
    resetButton.addEventListener("click", handleReset);
});

/**
 * 1. アプリ起動時に初期データをGASから取得
 */
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        const data = result.data;

        // 1-1. 社員名リストをドロップダウンに設定
        updateNameSelect(data.names);
        
        // 1-2. ランキングを表示
        updateRanking(data.ranking);
        
        // 1-3. ログイン情報をチェック
        checkLoginStatus();

    } catch (error {
        showError("初期データの読み込みに失敗しました: " + error.message, "login");
        showError("初期データの読み込みに失敗しました: " + error.message, "main");
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

        picksInput.value = ""; // 送信成功したら入力欄をクリア
        updateRanking(result.data); // 最新のランキングに更新

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
    // クリックされたボタンの data-value の値（"1", "5", "10"）を取得
    const valueToAdd = parseInt(e.target.dataset.value, 10);
    
    // 現在の入力値を取得
    const currentPicks = parseInt(picksInput.value, 10);

    if (isNaN(currentPicks)) {
        // 入力欄が空か数値でない場合は、ボタンの値で上書き
        picksInput.value = valueToAdd;
    } else {
        // 現在の値に加算する
        picksInput.value = currentPicks + valueToAdd;
    }
}

/**
 * ★★★ 追加 ★★★
 * 6. リセット処理
 */
function handleReset() {
    picksInput.value = ""; // 入力欄を空にする
    showError("", "main"); // エラーメッセージも消す
}


// --- 画面更新用のヘルパー関数 ---

/**
 * 社員名リストをドロップダウンに設定
 */
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

/**
 * ランキング（Top 3）を表示
 */
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
    showError("", "main");
    picksInput.value = "";
}

/**
 * 送信中・エラー表示の制御
 */
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

// type: "login" | "main"
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