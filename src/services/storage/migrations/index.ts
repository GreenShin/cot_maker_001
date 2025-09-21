/**
 * SQLite-WASM 마이그레이션 관리자
 * OPFS 기반 대용량 데이터 처리를 위한 데이터베이스 스키마 마이그레이션
 */

import type { Database } from '@sqlite.org/sqlite-wasm';

export interface Migration {
  id: string;
  version: number;
  name: string;
  sql: string;
}

/**
 * 마이그레이션 목록
 * 버전 순서대로 정의되어야 함
 */
export const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    version: 1,
    name: 'Initial Schema Creation',
    sql: `
-- CoT 데이터셋 관리 웹앱 - 초기 스키마
-- OPFS + SQLite-WASM 기반 대용량 데이터 처리

-- 질문자(UserAnon) 테이블
CREATE TABLE IF NOT EXISTS user_anon (
    id TEXT PRIMARY KEY,
    customer_source TEXT NOT NULL CHECK (customer_source IN ('증권', '보험')),
    age_group TEXT NOT NULL CHECK (age_group IN ('10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상')),
    gender TEXT NOT NULL CHECK (gender IN ('남', '여')),
    
    -- 증권 고객 전용 필드
    investment_tendency TEXT CHECK (investment_tendency IN ('미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형')),
    investment_amount INTEGER,
    
    -- 보험 고객 전용 필드  
    insurance_type TEXT CHECK (insurance_type IN ('미정의', '보장only', '변액only', '기타only', '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타')),
    
    -- 메타데이터
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 보유 상품(OwnedProduct) 테이블
CREATE TABLE IF NOT EXISTS owned_product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    purchase_date TEXT NOT NULL, -- YYYY-MM-DD 형식
    
    FOREIGN KEY (user_id) REFERENCES user_anon(id) ON DELETE CASCADE
);

-- 금융상품(Product) 테이블
CREATE TABLE IF NOT EXISTS product (
    id TEXT PRIMARY KEY,
    product_source TEXT NOT NULL CHECK (product_source IN ('증권', '보험')),
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('일반과세', '비과세', '세금우대', '연금저축')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', '4등급(높음)', '5등급(매우높음)', '6등급(매우높음)')),
    
    -- 증권 상품 전용 필드
    description TEXT,
    
    -- 메타데이터
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- CoT 질의응답(CoTQA) 테이블
CREATE TABLE IF NOT EXISTS cotqa (
    id TEXT PRIMARY KEY,
    product_source TEXT NOT NULL CHECK (product_source IN ('증권', '보험')),
    question_type TEXT NOT NULL,
    questioner_id TEXT NOT NULL,
    question TEXT NOT NULL,
    
    -- 필수 CoT 단계
    cot1 TEXT NOT NULL,
    cot2 TEXT NOT NULL,
    cot3 TEXT NOT NULL,
    
    -- 동적 CoT 단계 (JSON으로 저장)
    dynamic_cots TEXT DEFAULT '{}', -- JSON: {"cot4": "...", "cot5": "..."}
    
    answer TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('초안', '검토중', '완료', '보류')),
    author TEXT,
    
    -- 메타데이터
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (questioner_id) REFERENCES user_anon(id)
);

-- CoT-상품 관계 테이블 (다대다)
CREATE TABLE IF NOT EXISTS cotqa_product (
    cotqa_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    PRIMARY KEY (cotqa_id, product_id),
    FOREIGN KEY (cotqa_id) REFERENCES cotqa(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

-- 설정(Settings) 테이블
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 성능을 위한 인덱스 생성

-- 질문자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_anon_customer_source ON user_anon(customer_source);
CREATE INDEX IF NOT EXISTS idx_user_anon_age_group ON user_anon(age_group);
CREATE INDEX IF NOT EXISTS idx_user_anon_gender ON user_anon(gender);
CREATE INDEX IF NOT EXISTS idx_user_anon_compound ON user_anon(customer_source, age_group, gender);

-- 보유 상품 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_owned_product_user_id ON owned_product(user_id);
CREATE INDEX IF NOT EXISTS idx_owned_product_product_name ON owned_product(product_name);

-- 상품 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_product_source ON product(product_source);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(product_category);
CREATE INDEX IF NOT EXISTS idx_product_compound ON product(product_source, product_category);
CREATE INDEX IF NOT EXISTS idx_product_name ON product(product_name);

-- CoTQA 테이블 인덱스 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_cotqa_product_source ON cotqa(product_source);
CREATE INDEX IF NOT EXISTS idx_cotqa_question_type ON cotqa(question_type);
CREATE INDEX IF NOT EXISTS idx_cotqa_questioner_id ON cotqa(questioner_id);
CREATE INDEX IF NOT EXISTS idx_cotqa_status ON cotqa(status);
CREATE INDEX IF NOT EXISTS idx_cotqa_created_at ON cotqa(created_at);
CREATE INDEX IF NOT EXISTS idx_cotqa_updated_at ON cotqa(updated_at);
CREATE INDEX IF NOT EXISTS idx_cotqa_compound ON cotqa(product_source, question_type, status);

-- 전체 텍스트 검색을 위한 FTS 테이블 생성
CREATE VIRTUAL TABLE IF NOT EXISTS cotqa_fts USING fts5(
    id,
    question,
    cot1,
    cot2, 
    cot3,
    dynamic_cots,
    answer,
    content='cotqa',
    content_rowid='rowid'
);

-- CoTQA 데이터 변경 시 FTS 테이블 자동 업데이트를 위한 트리거
CREATE TRIGGER IF NOT EXISTS cotqa_fts_insert AFTER INSERT ON cotqa BEGIN
    INSERT INTO cotqa_fts(id, question, cot1, cot2, cot3, dynamic_cots, answer)
    VALUES (NEW.id, NEW.question, NEW.cot1, NEW.cot2, NEW.cot3, NEW.dynamic_cots, NEW.answer);
END;

CREATE TRIGGER IF NOT EXISTS cotqa_fts_update AFTER UPDATE ON cotqa BEGIN
    UPDATE cotqa_fts SET 
        question = NEW.question,
        cot1 = NEW.cot1,
        cot2 = NEW.cot2,
        cot3 = NEW.cot3,
        dynamic_cots = NEW.dynamic_cots,
        answer = NEW.answer
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS cotqa_fts_delete AFTER DELETE ON cotqa BEGIN
    DELETE FROM cotqa_fts WHERE id = OLD.id;
END;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS user_anon_updated_at AFTER UPDATE ON user_anon
FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at
BEGIN
    UPDATE user_anon SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS product_updated_at AFTER UPDATE ON product  
FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at
BEGIN
    UPDATE product SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS cotqa_updated_at AFTER UPDATE ON cotqa
FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at  
BEGIN
    UPDATE cotqa SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS settings_updated_at AFTER UPDATE ON settings
FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at
BEGIN  
    UPDATE settings SET updated_at = datetime('now') WHERE key = NEW.key;
END;

-- 기본 설정값 삽입
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('author', '관리자'),
    ('users_editable', 'true'),
    ('products_editable', 'true'), 
    ('font_size', '14'),
    ('theme_mode', 'light');
    `
  }
];

/**
 * 마이그레이션 버전 추적 테이블 생성
 */
export const createMigrationTable = (db: Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

/**
 * 현재 데이터베이스 버전 조회
 */
export const getCurrentVersion = (db: Database): number => {
  const result = db.exec(`
    SELECT version FROM schema_migrations 
    ORDER BY version DESC 
    LIMIT 1
  `);

  if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
};

/**
 * 마이그레이션 실행
 */
export const runMigration = (db: Database, migration: Migration): void => {
  console.log(`Running migration: ${migration.name} (v${migration.version})`);
  
  try {
    // 트랜잭션으로 마이그레이션 실행
    db.transaction(() => {
      // 마이그레이션 SQL 실행
      db.exec(migration.sql);
      
      // 마이그레이션 기록 저장
      db.exec(`
        INSERT INTO schema_migrations (version, name) 
        VALUES (${migration.version}, '${migration.name}')
      `);
    });
    
    console.log(`✅ Migration completed: ${migration.name}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migration.name}`, error);
    throw error;
  }
};

/**
 * 필요한 마이그레이션 모두 실행
 */
export const runMigrations = (db: Database): void => {
  console.log('🚀 Starting database migrations...');
  
  // 마이그레이션 테이블 생성
  createMigrationTable(db);
  
  // 현재 버전 확인
  const currentVersion = getCurrentVersion(db);
  console.log(`Current database version: ${currentVersion}`);
  
  // 실행할 마이그레이션 필터링
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);
  
  if (pendingMigrations.length === 0) {
    console.log('✅ Database is up to date');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  // 마이그레이션 순차 실행
  for (const migration of pendingMigrations) {
    runMigration(db, migration);
  }
  
  console.log('✅ All migrations completed successfully');
};

/**
 * 데이터베이스 초기화 (개발 전용)
 */
export const resetDatabase = (db: Database): void => {
  console.warn('🚨 Resetting database (DEVELOPMENT ONLY)');
  
  // 모든 테이블 삭제
  db.exec(`
    DROP TABLE IF EXISTS cotqa_fts;
    DROP TABLE IF EXISTS cotqa_product;
    DROP TABLE IF EXISTS cotqa;
    DROP TABLE IF EXISTS owned_product;
    DROP TABLE IF EXISTS product;
    DROP TABLE IF EXISTS user_anon;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS schema_migrations;
  `);
  
  // 마이그레이션 재실행
  runMigrations(db);
};

/**
 * 데이터베이스 통계 조회
 */
export const getDatabaseStats = (db: Database) => {
  const tables = ['user_anon', 'product', 'cotqa', 'owned_product'];
  const stats: Record<string, number> = {};
  
  for (const table of tables) {
    const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
    stats[table] = result[0]?.values?.[0]?.[0] as number || 0;
  }
  
  return stats;
};
