#!/usr/bin/env node

/**
 * 샘플 데이터 생성 스크립트
 * 로컬 CoT 데이터셋 관리 웹앱용
 */

const fs = require('fs');
const path = require('path');

// 샘플 데이터 생성 함수들
function generateUsers(count = 100) {
  const users = [];
  const ageGroups = ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상'];
  const genders = ['남', '여'];
  const customerSources = ['증권', '보험'];
  const investmentTendencies = ['미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형'];
  const insuranceTypes = ['미정의', '보장only', '변액only', '기타only', '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타'];

  for (let i = 1; i <= count; i++) {
    const customerSource = customerSources[Math.floor(Math.random() * customerSources.length)];
    const baseUser = {
      id: `user-${i.toString().padStart(4, '0')}`,
      customerSource,
      ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      ownedProducts: generateOwnedProducts(Math.floor(Math.random() * 5) + 1),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (customerSource === '증권') {
      baseUser.investmentTendency = investmentTendencies[Math.floor(Math.random() * investmentTendencies.length)];
      baseUser.investmentAmount = Math.floor(Math.random() * 10) * 1000 + 1000; // 1000 ~ 10000 만원
    } else {
      baseUser.insuranceType = insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)];
    }

    users.push(baseUser);
  }

  return users;
}

function generateOwnedProducts(count) {
  const productNames = [
    '삼성 S&P500 ETF', 'KODEX 200 ETF', '미래에셋 글로벌 펀드',
    '삼성 종신보험', 'KB 변액보험', '현대해상 실손보험',
    '신한 정기예금', 'KB 적금', '우리 CMA'
  ];

  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      productName: productNames[Math.floor(Math.random() * productNames.length)],
      purchaseDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  return products;
}

function generateProducts(count = 50) {
  const products = [];
  const productSources = ['증권', '보험'];
  const securitiesCategories = ['ETF', '펀드', '주식', '채권', 'ELS', 'DLS'];
  const insuranceCategories = ['종신보험', '정기보험', '변액보험', '연금보험', '실손보험', '암보험'];
  const taxTypes = ['일반과세', '비과세', '세금우대', '연금저축'];
  const riskLevels = ['1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', '4등급(높음)', '5등급(매우높음)', '6등급(매우높음)'];

  for (let i = 1; i <= count; i++) {
    const productSource = productSources[Math.floor(Math.random() * productSources.length)];
    const categories = productSource === '증권' ? securitiesCategories : insuranceCategories;
    
    const product = {
      id: `product-${i.toString().padStart(3, '0')}`,
      productSource,
      productName: `${productSource} 상품 ${i}`,
      productCategory: categories[Math.floor(Math.random() * categories.length)],
      taxType: taxTypes[Math.floor(Math.random() * taxTypes.length)],
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (productSource === '증권') {
      product.description = `${product.productCategory} 상품으로 ${product.riskLevel} 위험도를 가집니다.`;
    }

    products.push(product);
  }

  return products;
}

function generateCoTs(count = 30) {
  const cots = [];
  const productSources = ['증권', '보험'];
  const securitiesQuestionTypes = ['고객 특성 강조형', '투자성향 및 조건 기반형', '상품비교 추천형'];
  const insuranceQuestionTypes = ['연령별 및 생애주기 저축성 상품 추천형', '투자성 상품 추천형', '건강 및 질병 보장 대비형'];
  const statuses = ['초안', '검토중', '완료', '보류'];

  const sampleQuestions = {
    '증권': [
      '30대 직장인으로 안정적인 투자를 원합니다. 어떤 상품을 추천하시나요?',
      '은퇴 준비를 위한 장기 투자 상품을 찾고 있습니다.',
      '해외 투자에 관심이 있는데 초보자도 할 수 있는 상품이 있나요?'
    ],
    '보험': [
      '40대 가장으로서 가족을 위한 보장보험을 찾고 있습니다.',
      '노후 준비를 위한 연금보험 상품을 추천해주세요.',
      '건강에 대한 걱정이 많아 실손보험을 알아보고 있습니다.'
    ]
  };

  for (let i = 1; i <= count; i++) {
    const productSource = productSources[Math.floor(Math.random() * productSources.length)];
    const questionTypes = productSource === '증권' ? securitiesQuestionTypes : insuranceQuestionTypes;
    const questions = sampleQuestions[productSource];

    const cot = {
      id: `cot-${i.toString().padStart(3, '0')}`,
      productSource,
      questionType: questionTypes[Math.floor(Math.random() * questionTypes.length)],
      questioner: `user-${Math.floor(Math.random() * 100 + 1).toString().padStart(4, '0')}`,
      products: generateRandomProductIds(Math.floor(Math.random() * 3) + 1),
      question: questions[Math.floor(Math.random() * questions.length)],
      cot1: '먼저 고객의 현재 상황과 투자 목적을 파악해보겠습니다.',
      cot2: '고객의 위험성향과 투자 기간을 고려하여 적합한 상품군을 선별합니다.',
      cot3: '선별된 상품들의 특징과 장단점을 비교 분석합니다.',
      answer: '고객의 상황에 맞는 최적의 상품을 추천드립니다.',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      author: '관리자',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    cots.push(cot);
  }

  return cots;
}

function generateRandomProductIds(count) {
  const productIds = [];
  for (let i = 0; i < count; i++) {
    productIds.push(`product-${Math.floor(Math.random() * 50 + 1).toString().padStart(3, '0')}`);
  }
  return productIds;
}

// 메인 실행 함수
function main() {
  console.log('🌱 샘플 데이터 생성을 시작합니다...');

  const outputDir = path.join(__dirname, '../../public/sample-data');
  
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 데이터 생성
  const users = generateUsers(100);
  const products = generateProducts(50);
  const cots = generateCoTs(30);

  // JSON 파일로 저장
  fs.writeFileSync(
    path.join(outputDir, 'users.json'),
    JSON.stringify(users, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.join(outputDir, 'products.json'),
    JSON.stringify(products, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.join(outputDir, 'cots.json'),
    JSON.stringify(cots, null, 2),
    'utf8'
  );

  // CSV 파일도 생성 (간단한 형태)
  generateCSV(users, path.join(outputDir, 'users.csv'));
  generateCSV(products, path.join(outputDir, 'products.csv'));
  generateCSV(cots, path.join(outputDir, 'cots.csv'));

  console.log('✅ 샘플 데이터 생성 완료!');
  console.log(`📁 출력 위치: ${outputDir}`);
  console.log(`👥 질문자: ${users.length}개`);
  console.log(`📦 상품: ${products.length}개`);
  console.log(`💭 CoT: ${cots.length}개`);
  console.log('');
  console.log('🚀 사용법:');
  console.log('1. 웹앱에서 Import 버튼 클릭');
  console.log('2. public/sample-data/ 폴더의 JSON 또는 CSV 파일 선택');
  console.log('3. 데이터 확인 후 Import 실행');
}

function generateCSV(data, filePath) {
  if (data.length === 0) return;

  // 헤더 생성
  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';

  // 데이터 행 생성
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      } else if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      return value || '';
    });
    csv += values.join(',') + '\n';
  });

  fs.writeFileSync(filePath, csv, 'utf8');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  generateUsers,
  generateProducts,
  generateCoTs
};
