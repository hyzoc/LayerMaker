let scene, camera, renderer, controls;
let threeDCanvas;
let nameTextAlign = 'left';
let thicknessTextAlign = 'right';

function addLayer() {
    const layersDiv = document.getElementById('layers');
    const newLayer = document.createElement('div');
    const randomColor = getRandomColor();
    const currentUnit = document.getElementById('global-unit').value;
    const layerCount = document.querySelectorAll('.input-group').length + 1;
    
    newLayer.className = 'input-group';
    newLayer.innerHTML = `
        <div class="layer-main">
            <div class="layer-row">
                <input type="text" placeholder="層の名称" class="layer-name">
            </div>
            <div class="layer-row">
                <div class="thickness-input">
                    <input type="number" placeholder="厚み" class="layer-thickness" min="0" step="any">
                    <span class="unit-display">${currentUnit === 'none' ? '' : currentUnit}</span>
                </div>
                <div class="color-preview" style="background-color: #${randomColor}">
                    <input type="color" class="layer-color" value="#${randomColor}">
                </div>
                <button class="toggle-details" onclick="toggleDetails(this)" title="詳細設定">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
            </div>
        </div>
        <button class="delete-button" onclick="deleteLayer(this)" title="削除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <div class="move-controls">
            <button class="control-button move-up" onclick="moveLayer(this, 'up')" title="上に移動">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 15l-6-6-6 6"/>
                </svg>
            </button>
            <button class="control-button move-down" onclick="moveLayer(this, 'down')" title="下に移動">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>
        </div>
        <div class="layer-details">
            <div class="detail-group">
                <div class="text-options">
                    <div class="text-display-options">
                        <label>
                            <input type="checkbox" class="show-name" checked>
                            <span class="checkbox-label">層の名称を表示</span>
                        </label>
                        <label>
                            <input type="checkbox" class="show-thickness" checked>
                            <span class="checkbox-label">層厚みを表示</span>
                        </label>
                    </div>
                    <div class="text-color-options">
                        <label>
                            <input type="radio" name="text-color-${layerCount}" value="white" checked>
                            <span class="radio-label">白文字</span>
                        </label>
                        <label>
                            <input type="radio" name="text-color-${layerCount}" value="black">
                            <span class="radio-label">黒文字</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    layersDiv.appendChild(newLayer);
    addLayerEventListeners(newLayer);
    drawSection();
}

function addLayerEventListeners(layer) {
    const inputs = layer.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type === 'color') {
            // カラープレビューのクリックイベント
            const preview = input.parentElement;
            preview.addEventListener('click', () => {
                input.click();
            });
            // 色変更イベント
            input.addEventListener('input', (e) => {
                e.target.parentElement.style.backgroundColor = e.target.value;
                drawSection();
            });
        } else if (input.type === 'range') {
            // フォントサイズスライダーのイベント
            input.addEventListener('input', (e) => {
                const sizeValue = e.target.closest('.size-input-group').querySelector('.size-value');
                sizeValue.textContent = `${e.target.value}px`;
                drawSection();
            });
        } else if (input.type === 'number') {
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) {
                    e.target.value = 0;
                }
                drawSection();
            });
        } else {
            input.addEventListener('input', drawSection);
        }
    });
}

function deleteLayer(button) {
    button.closest('.input-group').remove();
    drawSection(); // 層を削除した後に描画を更新
}

// DOMContentLoadedイベントリスナーを更新
document.addEventListener('DOMContentLoaded', () => {
    const layers = document.querySelectorAll('.input-group');
    layers.forEach(layer => {
        const colorInput = layer.querySelector('.layer-color');
        const colorPreview = layer.querySelector('.color-preview');
        if (colorInput && colorPreview) {
            colorPreview.style.backgroundColor = colorInput.value;
            addLayerEventListeners(layer);
        }
    });
    
    // フォントサイズの初期値を設定
    changeFontSize();
});

function getRandomColor() {
    const colors = ['6366f1', '8b5cf6', 'ec4899', 'f43f5e', 'f97316', 'eab308', '22c55e', '06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function convertToMm(value, unit) {
    switch (unit) {
        case 'cm': return value * 10;
        case 'm': return value * 1000;
        case 'in': return value * 25.4;
        default: return value;
    }
}

function drawSection() {
    const canvas = document.getElementById('sectionCanvas');
    const ctx = canvas.getContext('2d');
    
    // キャンバスの設定
    const canvasHeight = 600;
    const canvasWidth = 800;
    const margin = 50;
    const drawableHeight = canvasHeight - (margin * 2);
    const drawableWidth = 500;

    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layers = document.getElementsByClassName('input-group');
    let totalThickness = 0;

    // 全体の厚みを計算
    for (let layer of layers) {
        const rawThickness = Number(layer.querySelector('.layer-thickness').value) || 0;
        const unit = layer.querySelector('.unit-display').textContent;
        totalThickness += convertToMm(rawThickness, unit);
    }

    // スケールを計算（描画可能な高さ / 全体の厚み）
    const scale = totalThickness > 0 ? drawableHeight / totalThickness : 0;
    
    // 中央に配置するためのY座標の開始位置を計算
    const totalDrawHeight = totalThickness * scale;
    const startY = (canvasHeight - totalDrawHeight) / 2;
    let currentY = startY;

    // X座標の開始位置を計算（中央揃え）
    const startX = (canvasWidth - drawableWidth) / 2;

    // 層の描画
    for (let layer of layers) {
        const name = layer.querySelector('.layer-name').value;
        const rawThickness = Number(layer.querySelector('.layer-thickness').value) || 0;
        const unit = layer.querySelector('.unit-display').textContent;
        const color = layer.querySelector('.layer-color').value;
        
        const thickness = convertToMm(rawThickness, unit);
        const layerHeight = thickness * scale;
        
        // 層を描画（グラデーションなし、角丸なし）
        ctx.fillStyle = color;
        ctx.fillRect(startX, currentY, drawableWidth, layerHeight);

        // 境界線
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, currentY, drawableWidth, layerHeight);

        // テキスト描画の設定
        if (layerHeight > 20) {
            const textColorInput = layer.querySelector('input[type="radio"]:checked');
            const textColor = textColorInput ? textColorInput.value : 'white';
            const nameVisible = document.getElementById('global-name-visible').checked;
            const thicknessVisible = document.getElementById('global-thickness-visible').checked;
            const showName = nameVisible && (layer.querySelector('.show-name')?.checked ?? true);
            const showThickness = thicknessVisible && (layer.querySelector('.show-thickness')?.checked ?? true);
            const nameFontSize = document.getElementById('global-name-font-size').value;
            const thicknessFontSize = document.getElementById('global-thickness-font-size').value;

            ctx.fillStyle = textColor === 'white' ? '#ffffff' : '#000000';
            ctx.textBaseline = 'middle';

            // 層の名称を描画
            if (showName && name) {
                ctx.font = `${nameFontSize}px "Segoe UI"`;
                ctx.textAlign = nameTextAlign;
                let nameX = startX + 15;
                if (nameTextAlign === 'center') {
                    nameX = startX + (drawableWidth / 2);
                } else if (nameTextAlign === 'right') {
                    nameX = startX + drawableWidth - 15;
                }
                ctx.fillText(name, nameX, currentY + (layerHeight / 2));
            }
            
            // 厚みを描画
            if (showThickness && rawThickness) {
                ctx.font = `${thicknessFontSize}px "Segoe UI"`;
                ctx.textAlign = thicknessTextAlign;
                let thicknessX = startX + 15;
                if (thicknessTextAlign === 'center') {
                    thicknessX = startX + (drawableWidth / 2);
                } else if (thicknessTextAlign === 'right') {
                    thicknessX = startX + drawableWidth - 15;
                }
                ctx.fillText(`${rawThickness}${unit}`, thicknessX, currentY + (layerHeight / 2));
            }
            ctx.textAlign = 'left'; // リセット
        }

        currentY += layerHeight;
    }
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 画像ダウンロード機能
function downloadImage() {
    const canvas = document.getElementById('sectionCanvas');
    const link = document.createElement('a');
    link.download = '断面図.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// ウィンドウリサイズ時にキャンバスを再描画
window.addEventListener('resize', drawSection);

function moveLayer(button, direction) {
    const currentLayer = button.closest('.input-group');
    const layers = document.getElementById('layers');
    
    if (direction === 'up' && currentLayer.previousElementSibling) {
        layers.insertBefore(currentLayer, currentLayer.previousElementSibling);
    } else if (direction === 'down' && currentLayer.nextElementSibling) {
        layers.insertBefore(currentLayer.nextElementSibling, currentLayer);
    }
    
    drawSection();
}

function changeGlobalUnit(newUnit) {
    const unitDisplays = document.querySelectorAll('.unit-display');
    unitDisplays.forEach(display => {
        display.textContent = newUnit === 'none' ? '' : newUnit;
    });
    drawSection();
}

function toggleLayerOptions(colorPreview) {
    const allOptions = document.querySelectorAll('.layer-options');
    const currentOptions = colorPreview.nextElementSibling;
    const overlay = document.querySelector('.options-overlay');
    
    // 他の開いているオプションを閉じる
    allOptions.forEach(options => {
        if (options !== currentOptions) {
            options.classList.remove('show');
        }
    });

    // 現在のオプションをトグル
    currentOptions.classList.toggle('show');
    
    // オーバーレイの処理
    if (currentOptions.classList.contains('show')) {
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'options-overlay';
            document.body.appendChild(newOverlay);
            newOverlay.addEventListener('click', closeAllOptions);
        }
        overlay.classList.add('show');
    } else {
        overlay?.classList.remove('show');
    }
}

function closeAllOptions() {
    const options = document.querySelectorAll('.layer-options');
    const overlay = document.querySelector('.options-overlay');
    options.forEach(option => option.classList.remove('show'));
    overlay?.classList.remove('show');
}

function toggleDetails(button) {
    const layer = button.closest('.input-group');
    const details = layer.querySelector('.layer-details');
    button.classList.toggle('active');
    details.classList.toggle('show');
}

// フォントサイズ変更関数を更新
function changeFontSize() {
    const nameFontSize = document.getElementById('global-name-font-size');
    const thicknessFontSize = document.getElementById('global-thickness-font-size');
    
    // 値の範囲を制限（0以上100以下）
    nameFontSize.value = Math.min(Math.max(nameFontSize.value, 0), 100);
    thicknessFontSize.value = Math.min(Math.max(thicknessFontSize.value, 0), 100);
    
    drawSection();
}

// ダウンロード機能
function download2D() {
    const canvas = document.getElementById('sectionCanvas');
    downloadCanvas(canvas, '断面図_2D.png');
}

function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// フォントの表示/非表示を切り替える関数を追加
function changeFontVisibility() {
    const nameVisible = document.getElementById('global-name-visible').checked;
    const thicknessVisible = document.getElementById('global-thickness-visible').checked;
    
    // 各層のチェックボックスを更新
    document.querySelectorAll('.input-group').forEach(layer => {
        const nameCheckbox = layer.querySelector('.show-name');
        const thicknessCheckbox = layer.querySelector('.show-thickness');
        
        if (nameCheckbox) nameCheckbox.checked = nameVisible;
        if (thicknessCheckbox) thicknessCheckbox.checked = thicknessVisible;
    });
    
    drawSection();
}

// テキストの配置を変更する関数
function changeTextAlign(button) {
    const align = button.dataset.align;
    const target = button.dataset.target;
    
    // 同じグループの他のボタンから active クラスを削除
    const buttons = button.parentElement.querySelectorAll('.align-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // クリックされたボタンに active クラスを追加
    button.classList.add('active');
    
    // グローバル変数を更新
    if (target === 'name') {
        nameTextAlign = align;
    } else {
        thicknessTextAlign = align;
    }
    
    drawSection();
}

window.onload = function() {
    const preview = document.querySelector('.preview');
    preview.innerHTML = ''; // プレビューを空に初期化
    const layers = document.querySelectorAll('.input-group');
    layers.forEach(layer => {
        const colorInput = layer.querySelector('.layer-color');
        const colorPreview = layer.querySelector('.color-preview');
        if (colorInput && colorPreview) {
            colorPreview.style.backgroundColor = colorInput.value;
            addLayerEventListeners(layer);
        }
    });
    
    // フォントサイズの初期値を設定
    changeFontSize();
} 