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
  customerSourceOptions,
  ageGroupOptions,
  genderOptions,
} from '../../models/userAnon';

export interface UserSearchFiltersProps {
  searchKeyword: string;
  customerSource: string;
  ageGroup: string;
  gender: string;
}

interface UserSearchFiltersComponentProps {
  filters: UserSearchFiltersProps;
  onFiltersChange: (filters: UserSearchFiltersProps) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function UserSearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}: UserSearchFiltersComponentProps) {
  const [expanded, setExpanded] = React.useState(false);

  const handleFilterChange = (field: keyof UserSearchFiltersProps) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    onFiltersChange({
      ...filters,
      [field]: event.target.value as string,
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  const hasActiveFilters = filters.searchKeyword || filters.customerSource || filters.ageGroup || filters.gender;

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
          placeholder="보유상품 검색 (상품명 키워드 입력)"
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>고객출처</InputLabel>
                <Select
                  value={filters.customerSource}
                  onChange={handleFilterChange('customerSource')}
                  label="고객출처"
                >
                  <MenuItem value="">
                    <em>전체</em>
                  </MenuItem>
                  {customerSourceOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>연령대</InputLabel>
                <Select
                  value={filters.ageGroup}
                  onChange={handleFilterChange('ageGroup')}
                  label="연령대"
                >
                  <MenuItem value="">
                    <em>전체</em>
                  </MenuItem>
                  {ageGroupOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>성별</InputLabel>
                <Select
                  value={filters.gender}
                  onChange={handleFilterChange('gender')}
                  label="성별"
                >
                  <MenuItem value="">
                    <em>전체</em>
                  </MenuItem>
                  {genderOptions.map(option => (
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
              검색어: {filters.searchKeyword}
            </Box>
          )}
          {filters.customerSource && (
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
              고객출처: {filters.customerSource}
            </Box>
          )}
          {filters.ageGroup && (
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
              연령대: {filters.ageGroup}
            </Box>
          )}
          {filters.gender && (
            <Box 
              sx={{ 
                px: 1, 
                py: 0.25, 
                bgcolor: 'success.50', 
                borderRadius: 1, 
                fontSize: '0.75rem',
                color: 'success.main'
              }}
            >
              성별: {filters.gender}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
