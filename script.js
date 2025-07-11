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

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('경력직 신입사원 자기소개 앱이 시작되었습니다.');
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 초기 데이터 로드
    loadIntroductions();
});

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 폼 제출 이벤트
    introForm.addEventListener('submit', handleFormSubmit);
    
    // 다시 시도 버튼 이벤트
    retryBtn.addEventListener('click', loadIntroductions);
    
    // 입력 필드 실시간 검증
    const requiredFields = introForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

/**
 * 폼 제출 처리
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 폼 데이터 검증
    if (!validateForm()) {
        return;
    }
    
    // 제출 상태 변경
    setSubmitState(true);
    
    try {
        // 폼 데이터 수집
        const formData = collectFormData();
        
        // 서버로 데이터 전송
        await submitIntroduction(formData);
        
        // 성공 처리
        handleSubmitSuccess();
        
    } catch (error) {
        // 에러 처리
        handleSubmitError(error);
    } finally {
        // 제출 상태 복원
        setSubmitState(false);
    }
}

/**
 * 폼 데이터 수집
 */
function collectFormData() {
    const formData = new FormData(introForm);
    const data = {};
    
    // 모든 필드 데이터 수집
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    
    // 타임스탬프 추가
    data.timestamp = new Date().toISOString();
    
    console.log('수집된 폼 데이터:', data);
    return data;
}

/**
 * 자기소개 데이터 서버 전송
 */
async function submitIntroduction(data) {
    console.log('서버로 데이터 전송 중...');
    
    const response = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('서버 응답:', result);
    
    if (result.error) {
        throw new Error(result.error);
    }
    
    return result;
}

/**
 * 제출 성공 처리
 */
function handleSubmitSuccess() {
    console.log('자기소개가 성공적으로 등록되었습니다.');
    
    // 폼 초기화
    introForm.reset();
    
    // 성공 메시지 표시
    showToast('자기소개가 성공적으로 등록되었습니다!', 'success');
    
    // 카드 목록 새로고침
    loadIntroductions();
}

/**
 * 제출 에러 처리
 */
function handleSubmitError(error) {
    console.error('자기소개 등록 중 오류:', error);
    
    let errorMsg = '자기소개 등록 중 오류가 발생했습니다.';
    
    if (error.message.includes('CORS')) {
        errorMsg = '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMsg = '네트워크 연결을 확인하고 다시 시도해주세요.';
    } else if (error.message) {
        errorMsg = error.message;
    }
    
    showToast(errorMsg, 'error');
}

/**
 * 제출 버튼 상태 변경
 */
function setSubmitState(isSubmitting) {
    if (isSubmitting) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

/**
 * 자기소개 목록 로드
 */
async function loadIntroductions() {
    console.log('자기소개 목록을 불러오는 중...');
    
    // 로딩 상태 표시
    showLoadingState();
    
    try {
        const introductions = await fetchIntroductions();
        displayIntroductions(introductions);
        
    } catch (error) {
        console.error('자기소개 목록 로드 오류:', error);
        showErrorState(error);
    }
}

/**
 * 서버에서 자기소개 목록 가져오기
 */
async function fetchIntroductions() {
    const response = await fetch(`${GAS_WEBAPP_URL}?action=get`, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('서버에서 받은 데이터:', result);
    
    if (result.error) {
        throw new Error(result.error);
    }
    
    return result.data || [];
}

/**
 * 자기소개 카드 표시
 */
function displayIntroductions(introductions) {
    console.log(`${introductions.length}개의 자기소개를 표시합니다.`);
    
    if (introductions.length === 0) {
        showEmptyState();
        return;
    }
    
    // 카드 컨테이너 표시
    hideAllStates();
    cardsContainer.style.display = 'grid';
    
    // 카드 HTML 생성
    cardsContainer.innerHTML = introductions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(intro => createIntroCard(intro))
        .join('');
}

/**
 * 개별 자기소개 카드 HTML 생성
 */
function createIntroCard(intro) {
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    return `
        <div class="intro-card">
            <div class="card-header">
                <div class="card-name">${escapeHtml(intro.name || '')}</div>
                <div class="card-department">${escapeHtml(intro.department || '')}</div>
                ${intro.timestamp ? `<div style="font-size: 0.8rem; color: #888; margin-top: 5px;">${formatDate(intro.timestamp)}</div>` : ''}
            </div>
            <div class="card-content">
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-briefcase"></i>
                        담당 업무
                    </div>
                    <div class="field-value">${escapeHtml(intro.responsibilities || '')}</div>
                </div>
                
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-industry"></i>
                        이전 직장
                    </div>
                    <div class="field-value">${escapeHtml(intro.previousCompany || '')}</div>
                </div>
                
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-brain"></i>
                        MBTI
                    </div>
                    <div class="field-value">
                        <span class="mbti-badge">${escapeHtml(intro.mbti || '')}</span>
                    </div>
                </div>
                
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-heart"></i>
                        취미
                    </div>
                    <div class="field-value">${escapeHtml(intro.hobbies || '')}</div>
                </div>
                
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-lightbulb"></i>
                        나의 TMI
                    </div>
                    <div class="field-value">${escapeHtml(intro.tmi || '')}</div>
                </div>
                
                <div class="card-field">
                    <div class="field-label">
                        <i class="fas fa-comments"></i>
                        동기들에게 한 마디
                    </div>
                    <div class="field-value">${escapeHtml(intro.greetings || '')}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 로딩 상태 표시
 */
function showLoadingState() {
    hideAllStates();
    loadingCards.style.display = 'block';
}

/**
 * 에러 상태 표시
 */
function showErrorState(error) {
    hideAllStates();
    errorState.style.display = 'block';
    
    let errorMsg = '데이터를 불러오는 중 오류가 발생했습니다.';
    
    if (error.message.includes('CORS')) {
        errorMsg = '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMsg = '네트워크 연결을 확인하고 다시 시도해주세요.';
    } else if (error.message) {
        errorMsg = error.message;
    }
    
    errorMessage.textContent = errorMsg;
}

/**
 * 빈 상태 표시
 */
function showEmptyState() {
    hideAllStates();
    emptyState.style.display = 'block';
}

/**
 * 모든 상태 숨기기
 */
function hideAllStates() {
    loadingCards.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    cardsContainer.style.display = 'none';
}

/**
 * 폼 검증
 */
function validateForm() {
    const requiredFields = introForm.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * 개별 필드 검증
 */
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const isValid = value !== '';
    
    // 에러 상태 업데이트
    updateFieldErrorState(field, isValid);
    
    return isValid;
}

/**
 * 필드 에러 상태 업데이트
 */
function updateFieldErrorState(field, isValid) {
    if (isValid) {
        field.style.borderColor = '#e0e0e0';
        removeFieldError(field);
    } else {
        field.style.borderColor = '#dc3545';
        showFieldError(field, '이 필드는 필수입니다.');
    }
}

/**
 * 필드 에러 메시지 표시
 */
function showFieldError(field, message) {
    removeFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 5px;
        font-weight: 500;
    `;
    
    field.parentNode.appendChild(errorElement);
}

/**
 * 필드 에러 메시지 제거
 */
function removeFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * 필드 에러 상태 클리어
 */
function clearFieldError(event) {
    const field = event.target;
    if (field.value.trim() !== '') {
        field.style.borderColor = '#e0e0e0';
        removeFieldError(field);
    }
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 토스트 스타일
    const backgroundColor = type === 'success' ? '#28a745' : 
                           type === 'error' ? '#dc3545' : 
                           'rgb(245, 80, 0)';
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // 애니메이션 스타일 추가
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 토스트 추가
    document.body.appendChild(toast);
    
    // 자동 제거
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 5000);
}

/**
 * HTML 이스케이프 처리
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 에러 로깅
 */
window.addEventListener('error', function(event) {
    console.error('전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});

console.log('자기소개 애플리케이션 스크립트가 로드되었습니다.');
