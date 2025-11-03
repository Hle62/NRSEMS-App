// ▼▼▼▼▼ 【必須】あなたのGASの「ウェブアプリURL」に書き換えてください ▼▼▼▼▼
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWEhThIS13xqaFqMIESmZh5L3VsiY4oAuhgFaCxYvYqbvMruQM921ZBQ1_rAv5BzYRSw/exec";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// --- DOM要素の取得 ---
const nameSelect = document.getElementById("nameSelect");
const picksForm = document.getElementById("picksForm");
const picksInput = document.getElementById("picksInput");
const submitButton = document.getElementById("submitButton");
const rankingList = document.getElementById("rankingList");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

// --- 起動時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. アプリ起動時に初期データをGASから取得
    fetchInitialData();

    // 2. フォーム送信（ピック数送信）のイベント
    picksForm.addEventListener("submit", handleSubmit);
    
    // 3. 名前を変更したらlocalStorageに保存（ログイン維持）
    nameSelect.addEventListener("change", (e) => {
        saveLoginName(e.target.value);
    });
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

        // 1-1. 社員名リストをドロップダウンに設定
        updateNameSelect(data.names);
        
        // 1-2. 保存された名前（ログイン情報）を復元
        loadLoginName();

        // 1-3. ランキングを表示
        updateRanking(data.ranking);

    } catch (error) {
        showError("初期データの読み込みに失敗しました: " + error.message);
    }
}

/**
 * 2. フォーム送信（ピック数送信）の処理
 */
async function handleSubmit(e) {
    e.preventDefault(); // フォームのデフォルト送信をキャンセル

    const name = nameSelect.value;
    const picks = picksInput.value;

    if (!name) {
        showError("名前が選択されていません。");
        return;
    }
    
    setLoading(true); // 送信中表示

    try {
        const postData = {
            name: name,
            picks: picks
        };
        
        // POSTリクエストでGASにデータを送信
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postData), 
        });

        if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);

        // 2-1. 送信成功したら入力欄をクリア
        picksInput.value = "";
        
        // 2-2. 最新のランキングに更新
        updateRanking(result.data);

    } catch (error) {
        showError("送信に失敗しました: " + error.message);
    } finally {
        setLoading(false); // 送信中表示を解除
    }
}

// --- 画面更新用のヘルパー関数 ---

/**
 * 社員名リストをドロップダウンに設定
 */
function updateNameSelect(names) {
    nameSelect.innerHTML = ""; // 「読み込み中...」をクリア
    
    // 空の選択肢
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "名前を選んでください";
    nameSelect.appendChild(defaultOption);

    // 社員名を追加
    names.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        nameSelect.appendChild(option);
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

    // 上位3名だけ（または3名未満なら全員）を表示
    const top3 = rankingData.slice(0, 3);

    top3.forEach((item, index) => {
        const li = document.createElement("li");
        
        // 日本円表記にカンマ区切りでフォーマット
        const formattedPay = item.pay.toLocaleString(); 

        // 表示内容を「ピック数」と「金額」に変更
        li.innerHTML = `${item.name} <span>${item.picks} ピック / ${formattedPay} 円</span>`;
        rankingList.appendChild(li);
    });
}

/**
 * ログイン名（最後に選んだ名前）をlocalStorageに保存
 */
function saveLoginName(name) {
    localStorage.setItem("vcrp_app_login_name", name);
}

/**
 * ログイン名をlocalStorageから読み込んでドロップダウンに設定
 */
function loadLoginName() {
    const savedName = localStorage.getItem("vcrp_app_login_name");
    if (savedName) {
        nameSelect.value = savedName;
    }
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

function showError(message) {
    errorMessage.textContent = "※ " + message;
    errorMessage.classList.remove("hidden");
}