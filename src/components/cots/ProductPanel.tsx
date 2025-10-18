import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Product } from '../../models/product';
import { PanelResizer } from '../common/PanelResizer';

const STORAGE_KEY = 'product-panel-split-ratio';
const DEFAULT_RATIO = 0.5; // 50:50
const MIN_RATIO = 0.2; // 최소 20%
const MAX_RATIO = 0.8; // 최대 80%

interface ProductPanelProps {
  selectedProducts: Product[];
  onOpenProductSelector: () => void;
  focusedFieldGuide?: {
    title: string;
    content: string;
  } | null;
}

export function ProductPanel({ 
  selectedProducts, 
  onOpenProductSelector,
  focusedFieldGuide
}: ProductPanelProps) {
  const [splitRatio, setSplitRatio] = useState(DEFAULT_RATIO);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // localStorage에서 비율 로드
  useEffect(() => {
    try {
      const savedRatio = localStorage.getItem(STORAGE_KEY);
      if (savedRatio) {
        const ratio = parseFloat(savedRatio);
        if (ratio >= MIN_RATIO && ratio <= MAX_RATIO) {
          setSplitRatio(ratio);
        }
      }
    } catch (error) {
      console.error('패널 비율 로드 실패:', error);
    }
  }, []);

  // 비율 조절 핸들러 - 의존성 제거하여 안정적인 참조 유지
  const handleResize = useCallback((deltaY: number) => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.clientHeight;
    if (containerHeight === 0) return;
    
    setSplitRatio(prevRatio => {
      const deltaRatio = deltaY / containerHeight;
      const newRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, prevRatio + deltaRatio));
      
      try {
        localStorage.setItem(STORAGE_KEY, newRatio.toString());
      } catch (error) {
        console.error('패널 비율 저장 실패:', error);
      }
      
      return newRatio;
    });
  }, []); // 빈 의존성 배열로 안정적인 참조 유지

  return (
    <Box ref={containerRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단: 상품 선택 영역 (동적 비율) */}
      <Box sx={{ 
        height: focusedFieldGuide ? `${splitRatio * 100}%` : '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <Box sx={{ 
          flexShrink: 0, 
          borderBottom: 1, 
          borderColor: 'divider', 
          p: 2,
          pb: 1
        }}>
          <Typography variant="h6">
            상품 선택 (선택사항)
          </Typography>
        </Box>
        
        {/* 스크롤 가능한 콘텐츠 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={onOpenProductSelector}
            sx={{ mb: 2 }}
            fullWidth
          >
            상품 검색
          </Button>

          {selectedProducts.length === 0 ? (
            <Alert severity="info">
              상품 선택은 선택사항입니다. 필요시 여러 개의 상품을 선택할 수 있습니다.
            </Alert>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                선택된 상품 ({selectedProducts.length}개)
              </Typography>
              <Box>
                {selectedProducts.map((product) => (
                  <Accordion key={product.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {product.productName}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={product.productSource} 
                          color={product.productSource === '증권' ? 'primary' : 'secondary'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        <strong>상품분류:</strong> {product.productCategory}<br />
                        <strong>세금유형:</strong> {product.taxType}<br />
                        <strong>위험등급:</strong> {product.riskLevel}<br />
                        <strong>상품설명:</strong> {'description' in product ? product.description || '설명 없음' : '설명 없음'}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* 리사이저 (가이드가 있을 때만 표시) */}
      {focusedFieldGuide && (
        <PanelResizer onResize={handleResize} orientation="horizontal" />
      )}

      {/* 하단: CoT 가이드 영역 (동적 비율) */}
      {focusedFieldGuide && (
        <Box sx={{ 
          height: `${(1 - splitRatio) * 100}%`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 헤더 */}
          <Box sx={{ 
            flexShrink: 0,
            borderBottom: 1, 
            borderColor: 'divider', 
            p: 2,
            pb: 1
          }}>
            <Typography variant="h6">
              {focusedFieldGuide.title}
            </Typography>
          </Box>
          
          {/* 스크롤 가능한 본문 영역 */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            p: 2,
            pt: 1
          }}>
            <Box sx={{
              minHeight: '100px',
              p: 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              '& h1': { fontSize: '1.5em', fontWeight: 'bold', mb: 1.5, mt: 2 },
              '& h2': { fontSize: '1.25em', fontWeight: 'bold', mb: 1, mt: 2, borderBottom: 1, borderColor: 'divider', pb: 0.5 },
              '& h3': { fontSize: '1.1em', fontWeight: 'bold', mb: 0.75, mt: 1.5 },
              '& p': { mb: 1.5, lineHeight: 1.6 },
              '& ul, & ol': { mb: 1.5, pl: 2.5 },
              '& li': { mb: 0.5 },
              '& code': { 
                bgcolor: 'action.hover', 
                px: 0.5, 
                py: 0.25, 
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.9em'
              },
              '& pre': { 
                bgcolor: 'action.hover', 
                p: 1.5, 
                borderRadius: 1,
                overflow: 'auto',
                mb: 1.5,
                fontSize: '0.9em'
              },
              '& pre code': {
                bgcolor: 'transparent',
                p: 0
              },
              '& blockquote': { 
                borderLeft: 4, 
                borderColor: 'primary.main', 
                pl: 1.5, 
                ml: 0,
                color: 'text.secondary',
                fontStyle: 'italic',
                mb: 1.5
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                mb: 1.5,
                fontSize: '0.9em'
              },
              '& th, & td': {
                border: 1,
                borderColor: 'divider',
                px: 1,
                py: 0.5,
                textAlign: 'left'
              },
              '& th': {
                bgcolor: 'action.hover',
                fontWeight: 'bold'
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              },
              '& hr': {
                my: 2,
                borderColor: 'divider'
              }
            }}>
              {focusedFieldGuide.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {focusedFieldGuide.content}
                </ReactMarkdown>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  가이드 내용이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
