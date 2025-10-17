# Import Data Formats Guide

질문자, 상품, CoT 데이터를 Import할 때 지원되는 데이터 형태를 설명합니다.

## 질문자 (UserAnon) Import

### ownedProducts 배열 필드 처리

`ownedProducts` 필드는 사용자가 보유한 상품 목록을 나타내며, 다음과 같은 형태로 저장할 수 있습니다:

#### 1. 구분자 형태 (권장)
```csv
ownedProducts
"ABC펀드:2024-01|XYZ주식:2024-02"
"보장성보험:2023-12"
""
```

#### 2. JSON 문자열 형태
```csv
ownedProducts
"[{""productName"":""ABC펀드"",""purchaseDate"":""2024-01""}]"
```

#### 3. JSON 파일에서는 배열 또는 문자열 모두 지원
```json
{
  "ownedProducts": [
    {"productName": "ABC펀드", "purchaseDate": "2024-01"},
    {"productName": "XYZ주식", "purchaseDate": "2024-02"}
  ]
}
```

또는

```json
{
  "ownedProducts": "ABC펀드:2024-01|XYZ주식:2024-02"
}
```

### 필수 필드
- `customerSource`: "증권" 또는 "보험"
- `ageGroup`: "10대", "20대", "30대", "40대", "50대", "60대", "70대", "80대 이상"
- `gender`: "남" 또는 "여"

### 고객출처별 조건부 필드
#### 증권 고객인 경우
- `investmentTendency` (선택): "미정의", "공격투자형", "적극투자형", "위험중립형", "안정추구형", "전문투자가형"

#### 보험 고객인 경우
- `insuranceCrossRatio` (선택): "미정의", "보장only", "변액only", "기타only", "보장+변액", "보장+기타", "변액+기타", "보장+변액+기타"

## CoT (CoTQA) Import

### Import/Export 필드명 매핑

CoT 데이터는 **Export 시** 다음과 같이 필드명이 변경됩니다:

| 내부 필드명 | Import/Export 필드명 | 설명 |
|-----------|-------------------|------|
| id | question_key | 질문 고유 키 |
| productSource | product_type | 상품 분류 (증권/보험) |
| questionType | question_type | 질문 유형 |
| createdAt | created_at | 생성일시 |
| updatedAt | updated_at | 수정일시 |
| questioner | questioner | 질문자 ID (유지) |
| products | products | 관련 상품 ID 목록 (유지) |
| question | question | 질문 내용 (유지) |
| cot1~n | cot1~n | CoT 단계 (유지) |
| answer | answer | 답변 (유지) |
| status | status | 상태 (유지) |
| author | author | 작성자 (유지) |

**참고**: Import 시에는 두 가지 필드명을 모두 인식합니다 (하위 호환성).

### products 배열 필드 처리

#### 구분자 형태 (CSV/XLSX Export 시)
```csv
products
"product-001|product-002|product-003"
```

#### JSON 배열 형태 (내부 저장 시)
```json
{
  "products": ["product-001", "product-002", "product-003"]
}
```

**참고**: Export된 CSV/JSON 파일에서는 `|` 구분자로 연결된 문자열로 표현됩니다.

## 상품 (Product) Import

상품 데이터는 현재 배열 필드가 없어 특별한 전처리가 불필요합니다.

### 필수 필드
- `productSource`: "증권" 또는 "보험"
- `productName`: 상품명
- `productCategory`: 상품분류 (상품출처에 따라 다름)
- `taxType`: "과세" 또는 "비과세"
- `riskLevel`: "1", "2", "3"

## 파일 형식 지원

- ✅ **CSV**: 헤더가 있는 CSV 파일
- ✅ **JSON**: 객체 배열 형태의 JSON 파일  
- ✅ **XLSX**: 첫 번째 워크시트의 헤더가 있는 Excel 파일

## 에러 처리

Import 과정에서 발생하는 에러는 다음과 같이 표시됩니다:

```
행 3: 필수 필드 '고객출처'가 누락되었습니다
행 5: 'ownedProducts' 배열 파싱에 실패했습니다  
행 7: '성별' 값이 유효하지 않습니다. '남' 또는 '여'여야 합니다
```

처음 5개 에러만 표시되며, 더 많은 에러가 있는 경우 총 개수가 함께 표시됩니다.
