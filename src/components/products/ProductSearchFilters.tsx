import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  productSourceOptions,
  securitiesCategoryOptions,
  insuranceCategoryOptions,
  getProductCategoriesBySource,
} from '../../models/product';

export interface ProductSearchFiltersProps {
  searchKeyword: string;
  productSource: string;
  productCategory: string;
}

interface ProductSearchFiltersComponentProps {
  filters: ProductSearchFiltersProps;
  onFiltersChange: (filters: ProductSearchFiltersProps) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function ProductSearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}: ProductSearchFiltersComponentProps) {
  const [expanded, setExpanded] = React.useState(false);

  const handleFilterChange = (field: keyof ProductSearchFiltersProps) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const newFilters = {
      ...filters,
      [field]: event.target.value as string,
    };
    
    // 상품출처가 변경되면 상품분류 초기화
    if (field === 'productSource') {
      newFilters.productCategory = '';
    }
    
    onFiltersChange(newFilters);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  const hasActiveFilters = filters.searchKeyword || filters.productSource || filters.productCategory;

  // 현재 선택된 상품출처에 따른 상품분류 옵션
  const categoryOptions = filters.productSource ? getProductCategoriesBySource(filters.productSource as '증권' | '보험') : [];

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* 검색어 입력 - 항상 표시 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: expanded ? 2 : 0 }}>
        <TextField
          placeholder="상품명 검색 (키워드 입력)"
          value={filters.searchKeyword}
          onChange={handleFilterChange('searchKeyword')}
          onKeyPress={handleKeyPress}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            endAdornment: filters.searchKeyword ? (
              <IconButton
                size="small"
                onClick={() => handleFilterChange('searchKeyword')({ target: { value: '' } })}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          sx={{ flex: 1 }}
        />
        
        <Button
          variant="contained"
          onClick={onSearch}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 'auto', px: 3 }}
        >
          검색
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClear}
          startIcon={<ClearIcon />}
          disabled={!hasActiveFilters}
          sx={{ minWidth: 'auto' }}
        >
          초기화
        </Button>
        
        <IconButton
          onClick={() => setExpanded(!expanded)}
          sx={{ ml: 1 }}
        >
          <FilterListIcon />
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* 고급 필터 - 접을 수 있음 */}
      <Collapse in={expanded}>
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            고급 검색 필터
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>상품출처</InputLabel>
                <Select
                  value={filters.productSource}
                  onChange={handleFilterChange('productSource')}
                  label="상품출처"
                >
                  <MenuItem value="">
                    <em>전체</em>
                  </MenuItem>
                  {productSourceOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>상품분류</InputLabel>
                <Select
                  value={filters.productCategory}
                  onChange={handleFilterChange('productCategory')}
                  label="상품분류"
                  disabled={!filters.productSource}
                >
                  <MenuItem value="">
                    <em>전체</em>
                  </MenuItem>
                  {categoryOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            활성 필터:
          </Typography>
          {filters.searchKeyword && (
            <Box 
              sx={{ 
                px: 1, 
                py: 0.25, 
                bgcolor: 'primary.50', 
                borderRadius: 1, 
                fontSize: '0.75rem',
                color: 'primary.main'
              }}
            >
              상품명: {filters.searchKeyword}
            </Box>
          )}
          {filters.productSource && (
            <Box 
              sx={{ 
                px: 1, 
                py: 0.25, 
                bgcolor: 'secondary.50', 
                borderRadius: 1, 
                fontSize: '0.75rem',
                color: 'secondary.main'
              }}
            >
              상품출처: {filters.productSource}
            </Box>
          )}
          {filters.productCategory && (
            <Box 
              sx={{ 
                px: 1, 
                py: 0.25, 
                bgcolor: 'info.50', 
                borderRadius: 1, 
                fontSize: '0.75rem',
                color: 'info.main'
              }}
            >
              상품분류: {filters.productCategory}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
