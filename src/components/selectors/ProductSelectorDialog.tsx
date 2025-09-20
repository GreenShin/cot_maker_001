import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchProducts } from '../../store/slices/productsSlice';
import { Product } from '../../models/product';

interface ProductSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  selectedProductIds?: string[];
}

const columns: GridColDef[] = [
  { field: 'productSource', headerName: '상품출처', width: 100 },
  { field: 'productName', headerName: '상품명', width: 200 },
  { field: 'productCategory', headerName: '상품분류', width: 120 },
  { field: 'taxType', headerName: '세금유형', width: 100 },
  { field: 'riskLevel', headerName: '위험등급', width: 100 },
];

export function ProductSelectorDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedProductIds = [] 
}: ProductSelectorDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, pagination } = useSelector((state: RootState) => state.products);
  
  const [filters, setFilters] = React.useState({
    productSource: '',
    productCategory: '',
    taxType: '',
  });
  
  const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>(selectedProductIds);

  React.useEffect(() => {
    if (open) {
      dispatch(fetchProducts({}));
    }
  }, [open, dispatch]);

  React.useEffect(() => {
    setSelectionModel(selectedProductIds);
  }, [selectedProductIds]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    // TODO: 필터링된 상품 목록 요청
    // dispatch(searchProducts({ filters: { ...filters, [field]: value } }));
  };

  const handleSelect = () => {
    const selectedProducts = items.filter(product => 
      selectionModel.includes(product.id)
    );
    onSelect(selectedProducts);
    onClose();
  };

  const handleCancel = () => {
    setSelectionModel(selectedProductIds);
    onClose();
  };

  // 상품출처에 따른 상품분류 옵션
  const getProductCategories = (productSource: string) => {
    if (productSource === '증권') {
      return ['주식형', '채권형', '재간접', '단기금융', '파생형', '신탁/퇴직연금'];
    } else if (productSource === '보험') {
      return ['연금', '종신', '정기', '질병', '건강', '암', '변액'];
    }
    return [];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>상품 선택 (다중 선택 가능)</DialogTitle>
      
      <DialogContent>
        {/* 필터 섹션 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pt: 1 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>상품출처</InputLabel>
            <Select
              value={filters.productSource}
              label="상품출처"
              onChange={(e) => {
                const newSource = e.target.value;
                handleFilterChange('productSource', newSource);
                // 상품출처 변경시 상품분류 초기화
                setFilters(prev => ({ ...prev, productCategory: '' }));
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="증권">증권</MenuItem>
              <MenuItem value="보험">보험</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>상품분류</InputLabel>
            <Select
              value={filters.productCategory}
              label="상품분류"
              onChange={(e) => handleFilterChange('productCategory', e.target.value)}
              disabled={!filters.productSource}
            >
              <MenuItem value="">전체</MenuItem>
              {getProductCategories(filters.productSource).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>세금유형</InputLabel>
            <Select
              value={filters.taxType}
              label="세금유형"
              onChange={(e) => handleFilterChange('taxType', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="과세">과세</MenuItem>
              <MenuItem value="비과세">비과세</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상품 목록 */}
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={items}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={pagination.total}
            paginationModel={{
              page: pagination.page - 1,
              pageSize: pagination.pageSize
            }}
            pageSizeOptions={[25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            // 성능 최적화 옵션
            rowBuffer={5}
            columnBuffer={4}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={true}
            density="compact"
            sx={{ border: 0 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>
          취소
        </Button>
        <Button 
          onClick={handleSelect} 
          variant="contained"
          disabled={selectionModel.length === 0}
        >
          선택 ({selectionModel.length}개)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
