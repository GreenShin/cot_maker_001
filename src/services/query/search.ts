import { CoTQA } from '../../models/cotqa';
import { Product } from '../../models/product';
import { UserAnon } from '../../models/userAnon';

// 검색 옵션
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  highlightMatches?: boolean;
}

// 검색 결과
export interface SearchResult<T> {
  item: T;
  matches: SearchMatch[];
  score: number; // 관련성 점수 (0-1)
}

export interface SearchMatch {
  field: string;
  value: string;
  matchStart: number;
  matchEnd: number;
  context?: string; // 매치 주변 컨텍스트
}

// 텍스트 검색 유틸리티 클래스
export class TextSearchService {
  private normalizeText(text: string, options: SearchOptions = {}): string {
    let normalized = text.trim();
    
    if (!options.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    return normalized;
  }

  private createSearchPattern(query: string, options: SearchOptions = {}): RegExp {
    let pattern = query;
    
    if (options.useRegex) {
      return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }
    
    // 특수 문자 이스케이프
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }

  private findMatches(
    text: string,
    query: string,
    field: string,
    options: SearchOptions = {}
  ): SearchMatch[] {
    if (!text || !query) return [];
    
    const normalizedText = this.normalizeText(text, options);
    const normalizedQuery = this.normalizeText(query, options);
    const pattern = this.createSearchPattern(normalizedQuery, options);
    
    const matches: SearchMatch[] = [];
    let match;
    
    while ((match = pattern.exec(normalizedText)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      // 컨텍스트 생성 (매치 주변 50자)
      const contextStart = Math.max(0, matchStart - 50);
      const contextEnd = Math.min(normalizedText.length, matchEnd + 50);
      const context = normalizedText.slice(contextStart, contextEnd);
      
      matches.push({
        field,
        value: match[0],
        matchStart,
        matchEnd,
        context,
      });
      
      // 무한 루프 방지
      if (pattern.lastIndex === match.index) {
        pattern.lastIndex++;
      }
    }
    
    return matches;
  }

  private calculateScore(matches: SearchMatch[], totalFields: number): number {
    if (matches.length === 0) return 0;
    
    // 매치 개수와 필드 다양성을 고려한 점수
    const matchCount = matches.length;
    const uniqueFields = new Set(matches.map(m => m.field)).size;
    
    // 기본 점수: 매치 개수 기반
    let score = Math.min(matchCount / 10, 1); // 최대 10개 매치까지 고려
    
    // 필드 다양성 보너스
    const fieldDiversityBonus = uniqueFields / totalFields * 0.3;
    score += fieldDiversityBonus;
    
    return Math.min(score, 1);
  }

  // CoTQA 검색
  searchCoTQA(
    items: CoTQA[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<CoTQA>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<CoTQA>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      // 검색 대상 필드들
      const searchFields = [
        { key: 'question', value: item.question },
        { key: 'cot1', value: item.cot1 },
        { key: 'cot2', value: item.cot2 },
        { key: 'cot3', value: item.cot3 },
        { key: 'answer', value: item.answer },
        { key: 'questionType', value: item.questionType },
        { key: 'status', value: item.status },
        { key: 'author', value: item.author || '' },
      ];
      
      // 동적 CoT 필드들도 검색
      Object.keys(item).forEach(key => {
        if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
          const value = (item as any)[key];
          if (typeof value === 'string') {
            searchFields.push({ key, value });
          }
        }
      });
      
      // 각 필드에서 매치 찾기
      for (const field of searchFields) {
        const matches = this.findMatches(field.value ?? '', query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    // 점수순으로 정렬
    return results.sort((a, b) => b.score - a.score);
  }

  // Product 검색
  searchProducts(
    items: Product[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<Product>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<Product>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      const searchFields = [
        { key: 'productName', value: item.productName },
        { key: 'productCategory', value: item.productCategory },
        { key: 'description', value: item.description || '' },
        { key: 'managementCompany', value: item.managementCompany || '' },
        { key: 'expectedReturn', value: item.expectedReturn || '' },
      ];
      
      for (const field of searchFields) {
        const matches = this.findMatches(field.value, query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  // UserAnon 검색
  searchUsers(
    items: UserAnon[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<UserAnon>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<UserAnon>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      const searchFields: Array<{ key: string; value: string }> = [
        { key: 'ageGroup', value: item.ageGroup },
        { key: 'gender', value: item.gender },
        { key: 'customerSource', value: item.customerSource },
      ];
      
      // 고객출처별 특수 필드
      if (item.customerSource === '증권' && 'investmentTendency' in item) {
        searchFields.push({ key: 'investmentTendency', value: (item as any).investmentTendency || '' });
      } else if (item.customerSource === '보험' && 'insuranceCrossRatio' in item) {
        searchFields.push({ key: 'insuranceCrossRatio', value: (item as any).insuranceCrossRatio || '' });
      }
      
      // 보유 상품 검색
      if (item.ownedProducts) {
        item.ownedProducts.forEach((product, index) => {
          searchFields.push({
            key: `ownedProducts[${index}].productName`,
            value: product.productName ?? '',
          });
        });
      }
      
      for (const field of searchFields) {
        const matches = this.findMatches(field.value, query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  // 텍스트 하이라이트
  highlightText(
    text: string,
    matches: SearchMatch[],
    highlightClass: string = 'search-highlight'
  ): string {
    if (!matches.length) return text;
    
    // 매치들을 위치순으로 정렬
    const sortedMatches = [...matches].sort((a, b) => a.matchStart - b.matchStart);
    
    let result = '';
    let lastIndex = 0;
    
    for (const match of sortedMatches) {
      // 매치 이전 텍스트
      result += text.slice(lastIndex, match.matchStart);
      
      // 하이라이트된 매치
      result += `<span class="${highlightClass}">${text.slice(match.matchStart, match.matchEnd)}</span>`;
      
      lastIndex = match.matchEnd;
    }
    
    // 마지막 매치 이후 텍스트
    result += text.slice(lastIndex);
    
    return result;
  }

  // 검색 제안
  getSuggestions(
    items: (CoTQA | Product | UserAnon)[],
    query: string,
    maxSuggestions: number = 5
  ): string[] {
    if (!query.trim() || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    // 각 아이템의 텍스트 필드에서 제안 추출
    for (const item of items) {
      const texts: string[] = [];
      
      if ('question' in item) {
        // CoTQA
        texts.push(item.question ?? '', item.cot1 ?? '', item.cot2 ?? '', item.cot3 ?? '', item.answer ?? '');
      } else if ('productName' in item) {
        // Product
        texts.push(item.productName, item.productCategory);
        if (item.description) texts.push(item.description);
      } else {
        // UserAnon
        texts.push(item.ageGroup, item.gender, item.customerSource);
      }
      
      // 단어 단위로 분할하여 제안 생성
      for (const text of texts) {
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.includes(lowerQuery) && word.length > 2) {
            suggestions.add(word);
          }
        }
      }
      
      if (suggestions.size >= maxSuggestions) break;
    }
    
    return Array.from(suggestions).slice(0, maxSuggestions);
  }
}

// 싱글톤 인스턴스
export const textSearchService = new TextSearchService();
