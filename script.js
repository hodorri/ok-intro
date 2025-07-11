/**
 * 경력직 신입사원 자기소개 웹 애플리케이션
 * Google Apps Script와 연동하여 데이터 저장 및 조회
 */

// Google Apps Script 웹앱 URL
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxFs69R1ufeRvRrJYidDZXDEOs0os1FEfUwWN2TBUHATuFqgeuMd1-21qF0RltE3Wxo/exec';

// DOM 요소 참조
const introForm = document.getElementById('introForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.querySelector('.btn-text');
const loadingSpinner = document.querySelector('.loading-spinner');
const cardsContainer = document.getElementById('cardsContainer');
const loadingCards = document.getElementById('loadingCards');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

document.addEventListener('DOMContentLoaded', function () {
    console.log('경력직 신입사원 자기소개 앱이 시작되었습니다.');
    setupEventListeners();
    loadIntroductions();
});

function setupEventListeners() {
    introForm.addEventListener('submit', handleFormSubmit);
    retryBtn.addEventListener('click', loadIntroductions);
    const requiredFields = introForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitState(true);
    try {
        const formData = collectFormData();
        await submitIntroduction(formData);
        handleSubmitSuccess();
    } catch (error) {
        handleSubmitError(error);
    } finally {
        setSubmitState(false);
    }
}

function collectFormData() {
    const formData = new FormData(introForm);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    data.timestamp = new Date().toISOString();
    return data;
}

async function submitIntroduction(data) {
    const response = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
    const result = await response.text();
    return result;
}

function handleSubmitSuccess() {
    introForm.reset();
    showToast('자기소개가 성공적으로 등록되었습니다!', 'success');
    loadIntroductions();
}

function handleSubmitError(error) {
    let errorMsg = '오류가 발생했습니다';
    if (error.message.includes('CORS')) errorMsg = 'CORS 정책으로 인해 서버 연결에 실패했습니다';
    else if (error.message.includes('fetch')) errorMsg = '네트워크 연결에 실패했습니다';
    else errorMsg = error.message;
    showToast(errorMsg, 'error');
}

function setSubmitState(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    btnText.style.display = isSubmitting ? 'none' : 'block';
    loadingSpinner.style.display = isSubmitting ? 'block' : 'none';
}

async function loadIntroductions() {
    showLoadingState();
    try {
        const introductions = await fetchIntroductions();
        displayIntroductions(introductions);
    } catch (error) {
        showErrorState(error);
    }
}

async function fetchIntroductions() {
    const response = await fetch(`${GAS_WEBAPP_URL}?action=read`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
    const result = await response.json();
    return result;
}

function displayIntroductions(introductions) {
    if (!introductions.length) return showEmptyState();
    hideAllStates();
    cardsContainer.style.display = 'grid';
    cardsContainer.innerHTML = introductions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(createIntroCard)
        .join('');
}

function createIntroCard(intro) {
    const formatDate = ts => new Date(ts).toLocaleDateString('ko-KR');
    return `
        <div class="intro-card">
            <div class="card-header">
                <div class="card-name">${escapeHtml(intro.name)}</div>
                <div class="card-department">${escapeHtml(intro.department)}</div>
                <div class="card-date">${formatDate(intro.timestamp)}</div>
            </div>
            <div class="card-content">
                <div><b>담당 업무:</b> ${escapeHtml(intro.responsibilities)}</div>
                <div><b>이전 직장:</b> ${escapeHtml(intro.previousCompany)}</div>
                <div><b>MBTI:</b> ${escapeHtml(intro.mbti)}</div>
                <div><b>취미:</b> ${escapeHtml(intro.hobbies)}</div>
                <div><b>나의 TMI:</b> ${escapeHtml(intro.tmi)}</div>
                <div><b>한 마디:</b> ${escapeHtml(intro.greetings)}</div>
            </div>
        </div>
    `;
}

function showLoadingState() {
    hideAllStates();
    loadingCards.style.display = 'block';
}

function showErrorState(error) {
    hideAllStates();
    errorState.style.display = 'block';
    errorMessage.textContent = error.message;
}

function showEmptyState() {
    hideAllStates();
    emptyState.style.display = 'block';
}

function hideAllStates() {
    [loadingCards, errorState, emptyState, cardsContainer].forEach(el => el.style.display = 'none');
}

function validateForm() {
    const requiredFields = introForm.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            updateFieldErrorState(field, false);
        } else {
            updateFieldErrorState(field, true);
        }
    });
    return isValid;
}

function updateFieldErrorState(field, isValid) {
    field.style.borderColor = isValid ? '#e0e0e0' : '#dc3545';
    if (!isValid) showFieldError(field, '이 필드는 필수입니다.');
    else removeFieldError(field);
}

function showFieldError(field, message) {
    removeFieldError(field);
    const err = document.createElement('div');
    err.className = 'field-error';
    err.textContent = message;
    err.style.color = '#dc3545';
    field.parentNode.appendChild(err);
}

function removeFieldError(field) {
    const err = field.parentNode.querySelector('.field-error');
    if (err) err.remove();
}

function clearFieldError(e) {
    if (e.target.value.trim()) updateFieldErrorState(e.target, true);
}

function showToast(message, type = 'info') {
    const prev = document.querySelector('.toast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: bold;
        z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
