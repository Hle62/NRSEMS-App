// ▼▼▼▼▼ ご提示いただいたURL ▼▼▼▼▼
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWEhThIS13xqaFqMIESmZh5L3VsiY4oAuhgFaCxYvYqbvMruQM921ZBQ1_rAv5BzYRSw/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- グローバル変数 ---
let currentLoginName = ""; // ログイン中のユーザー名を保持
const LOGIN_STORAGE_KEY = "vcrp_app_login_name"; // localStorageのキー

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
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const currentUserName = document.getElementById("currentUserName");
const logoutButton = document.getElementById("logoutButton");

// --- 起動時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. アプリ起動時に初期データをGASから取得
    fetchInitialData();

    // 2. ログインフォームのイベント
    loginForm.addEventListener("submit", handleLogin);
    
    // 3. ピック数送信フォームのイベント
    picksForm.addEventListener("submit", handleSubmit);
    
    // 4. ログアウト（名前変更）ボタンのイベント
    logoutButton.addEventListener("click", handleLogout);
});

/**
 * 1. アプリ起動時に初期データをGASから取得
 */
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_API_URL); // GETリクエスト
        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        const data = result.data;

        // 1-1. 社員名リストを「ログイン画面のドロップダウン」に設定
        updateNameSelect(data.names);
        
        // 1-2. ランキングを表示
        updateRanking(data.ranking);
        
        // 1-3. 保存された名前（ログイン情報）をチェック
        checkLoginStatus();

    } catch (error) {
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
        // ログイン情報あり
        currentLoginName = savedName;
        currentUserName.textContent = savedName; // メイン画面の名前表示を更新
        showMainScreen(); // メイン画面へ
    } else {
        // ログイン情報なし
        showLoginScreen(); // ログイン画面へ
    }
}

/**
 * 2. ログイン処理 (ログインボタン押下時)
 */
function handleLogin(e) {
    e.preventDefault();
    const selectedName = loginNameSelect.value;

    if (!selectedName) {
        showError("名前を選択してください。", "login");
        return;
    }

    // ログイン情報を保存
    currentLoginName = selectedName;
    localStorage.setItem(LOGIN_STORAGE_KEY, selectedName);
    
    // メイン画面に切り替え
    currentUserName.textContent = selectedName;
    showMainScreen();
}

/**
 * 3. フォーム送信（ピック数送信）の処理
 */
async function handleSubmit(e) {
    e.preventDefault(); // フォームのデフォルト送信をキャンセル

    const picks = picksInput.value;

    if (!currentLoginName) {
        showError("ログイン情報がありません。再度ログインしてください。", "main");
        handleLogout(); // 強制的にログアウト
        return;
    }
    
    setLoading(true); // 送信中表示

    try {
        const postData = {
            name: currentLoginName, // ログイン中の名前を使う
            picks: picks
        };
        
        // POSTリクエストでGASにデータを送信
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "cors",
            // ★★★ CORSエラー対策のため、headers: {} ブロックを削除 ★★★
            body: JSON.stringify(postData), 
        });

        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        // 3-1. 送信成功したら入力欄をクリア
        picksInput.value = "";
        
        // 3-2. 最新のランキングに更新
        updateRanking(result.data);

    } catch (error) {
        showError("送信に失敗しました: " + error.message, "main");
    } finally {
        setLoading(false); // 送信中表示を解除
    }
}

/**
 * 4. ログアウト処理 (名前変更ボタン押下時)
 */
function handleLogout() {
    // 保存した名前を削除
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    currentLoginName = "";
    
    // ログイン画面に戻す
    showLoginScreen();
}


// --- 画面更新用のヘルパー関数 ---

/**
 * 社員名リストを「ログイン画面のドロップダウン」に設定
 */
function updateNameSelect(names) {
    loginNameSelect.innerHTML = ""; // 「読み込み中...」をクリア
    
    // 空の選択肢
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "名前を選んでください";
    loginNameSelect.appendChild(defaultOption);

    // 社員名を追加
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
    rankingList.innerHTML = ""; // 「読み込み中...」をクリア

    if (!rankingData || rankingData.length === 0) {
        rankingList.innerHTML = "<li>データがありません</li>";
        return;
    }

    // 上位3名だけ
    const top3 = rankingData.slice(0, 3);

    top3.forEach((item) => {
        const li = document.createElement("li");
        
        // 金額表示を削除
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
    // メイン画面表示時にエラーをクリア
    showError("", "main");
    picksInput.value = ""; // 入力欄をクリア
}


/**
 * 送信中・エラー表示の制御
 */
function setLoading(isLoading) {
    if (isLoading) {
        submitButton.disabled = true;
        loadingMessage.classList.remove("hidden");
        errorMessage.classList.add("hidden"); // エラーを隠す
    } else {
        submitButton.disabled = false;
        loadingMessage.classList.add("hidden");
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
}// ▼▼▼▼▼ ご提示いただいたURL ▼▼▼▼▼
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWEhThIS13xqaFqMIESmZh5L3VsiY4oAuhgFaCxYvYqbvMruQM921ZBQ1_rAv5BzYRSw/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- グローバル変数 ---
let currentLoginName = ""; // ログイン中のユーザー名を保持
const LOGIN_STORAGE_KEY = "vcrp_app_login_name"; // localStorageのキー

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
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const currentUserName = document.getElementById("currentUserName");
const logoutButton = document.getElementById("logoutButton");

// --- 起動時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. アプリ起動時に初期データをGASから取得
    fetchInitialData();

    // 2. ログインフォームのイベント
    loginForm.addEventListener("submit", handleLogin);
    
    // 3. ピック数送信フォームのイベント
    picksForm.addEventListener("submit", handleSubmit);
    
    // 4. ログアウト（名前変更）ボタンのイベント
    logoutButton.addEventListener("click", handleLogout);
});

/**
 * 1. アプリ起動時に初期データをGASから取得
 */
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_API_URL); // GETリクエスト
        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        const data = result.data;

        // 1-1. 社員名リストを「ログイン画面のドロップダウン」に設定
        updateNameSelect(data.names);
        
        // 1-2. ランキングを表示
        updateRanking(data.ranking);
        
        // 1-3. 保存された名前（ログイン情報）をチェック
        checkLoginStatus();

    } catch (error) {
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
        // ログイン情報あり
        currentLoginName = savedName;
        currentUserName.textContent = savedName; // メイン画面の名前表示を更新
        showMainScreen(); // メイン画面へ
    } else {
        // ログイン情報なし
        showLoginScreen(); // ログイン画面へ
    }
}

/**
 * 2. ログイン処理 (ログインボタン押下時)
 */
function handleLogin(e) {
    e.preventDefault();
    const selectedName = loginNameSelect.value;

    if (!selectedName) {
        showError("名前を選択してください。", "login");
        return;
    }

    // ログイン情報を保存
    currentLoginName = selectedName;
    localStorage.setItem(LOGIN_STORAGE_KEY, selectedName);
    
    // メイン画面に切り替え
    currentUserName.textContent = selectedName;
    showMainScreen();
}

/**
 * 3. フォーム送信（ピック数送信）の処理
 */
async function handleSubmit(e) {
    e.preventDefault(); // フォームのデフォルト送信をキャンセル

    const picks = picksInput.value;

    if (!currentLoginName) {
        showError("ログイン情報がありません。再度ログインしてください。", "main");
        handleLogout(); // 強制的にログアウト
        return;
    }
    
    setLoading(true); // 送信中表示

    try {
        const postData = {
            name: currentLoginName, // ログイン中の名前を使う
            picks: picks
        };
        
        // POSTリクエストでGASにデータを送信
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "cors",
            // ★★★ CORSエラー対策のため、headers: {} ブロックを削除 ★★★
            body: JSON.stringify(postData), 
        });

        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        // 3-1. 送信成功したら入力欄をクリア
        picksInput.value = "";
        
        // 3-2. 最新のランキングに更新
        updateRanking(result.data);

    } catch (error) {
        showError("送信に失敗しました: " + error.message, "main");
    } finally {
        setLoading(false); // 送信中表示を解除
    }
}

/**
 * 4. ログアウト処理 (名前変更ボタン押下時)
 */
function handleLogout() {
    // 保存した名前を削除
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    currentLoginName = "";
    
    // ログイン画面に戻す
    showLoginScreen();
}


// --- 画面更新用のヘルパー関数 ---

/**
 * 社員名リストを「ログイン画面のドロップダウン」に設定
 */
function updateNameSelect(names) {
    loginNameSelect.innerHTML = ""; // 「読み込み中...」をクリア
    
    // 空の選択肢
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "名前を選んでください";
    loginNameSelect.appendChild(defaultOption);

    // 社員名を追加
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
    rankingList.innerHTML = ""; // 「読み込み中...」をクリア

    if (!rankingData || rankingData.length === 0) {
        rankingList.innerHTML = "<li>データがありません</li>";
        return;
    }

    // 上位3名だけ
    const top3 = rankingData.slice(0, 3);

    top3.forEach((item) => {
        const li = document.createElement("li");
        
        // 金額表示を削除
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
    // メイン画面表示時にエラーをクリア
    showError("", "main");
    picksInput.value = ""; // 入力欄をクリア
}


/**
 * 送信中・エラー表示の制御
 */
function setLoading(isLoading) {
    if (isLoading) {
        submitButton.disabled = true;
        loadingMessage.classList.remove("hidden");
        errorMessage.classList.add("hidden"); // エラーを隠す
    } else {
        submitButton.disabled = false;
        loadingMessage.classList.add("hidden");
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