import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Product } from '../../models/product';

interface ProductPanelProps {
  selectedProducts: Product[];
  onOpenProductSelector: () => void;
}

export function ProductPanel({ 
  selectedProducts, 
  onOpenProductSelector 
}: ProductPanelProps) {
  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        상품 선택
      </Typography>
      
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
          상품을 선택해 주세요. 여러 개의 상품을 선택할 수 있습니다.
        </Alert>
      ) : (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            선택된 상품 ({selectedProducts.length}개)
          </Typography>
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
      )}
    </Box>
  );
}
