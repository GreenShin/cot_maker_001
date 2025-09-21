import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button, Box } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import { ProductSearchFiltersComponent, type ProductSearchFiltersProps } from '../../components/products/ProductSearchFilters';
import type { RootState, AppDispatch } from '../../store';
import { 
  fetchProductsWithFilters, 
  setFilters, 
  clearFilters, 
  type ProductSearchFilters 
} from '../../store/slices/productsSlice';

const columns: GridColDef[] = [
  { field: 'productSource', headerName: '상품출처', width: 100 },
  { field: 'productName', headerName: '상품명', width: 200, flex: 1 },
  { field: 'productCategory', headerName: '상품분류', width: 150 },
  { field: 'taxType', headerName: '세금유형', width: 100 },
  { field: 'riskLevel', headerName: '위험등급', width: 100 },
  { field: 'managementCompany', headerName: '운용사', width: 150 },
];

export function ProductsListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, loading, pagination, filters } = useSelector((state: RootState) => state.products);

  // 초기 데이터 로드 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    dispatch(fetchProductsWithFilters({
      filters: {
        searchKeyword: '',
        productSource: '',
        productCategory: '',
      },
      page: 1,
      pageSize: 50
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 로드만 수행하므로 의존성 배열 비워둠

  // 검색 실행
  const handleSearch = useCallback(() => {
    dispatch(fetchProductsWithFilters({
      filters,
      page: 1, // 검색 시 첫 페이지로 리셋
      pageSize: pagination.pageSize
    }));
  }, [dispatch, filters, pagination.pageSize]);

  // 필터 변경
  const handleFiltersChange = useCallback((newFilters: ProductSearchFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  // 필터 초기화
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const toolbar = (
    <>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={() => navigate('/products/new')}
        sx={{ mr: 1 }}
      >
        새로 만들기
      </Button>
      <Button variant="outlined" startIcon={<UploadIcon />}>
        Import
      </Button>
      <Button variant="outlined" startIcon={<DownloadIcon />}>
        Export
      </Button>
    </>
  );

  return (
    <ListLayout title="상품 리스트" toolbar={toolbar}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 검색 필터 */}
        <ProductSearchFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />
        
        {/* 데이터 그리드 */}
        <Box sx={{ flex: 1 }}>
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
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/products/${params.id}`)}
            // 성능 최적화 옵션
            rowBuffer={10}
            columnBuffer={4}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={false}
            density="standard"
            sx={{ 
              border: 0,
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              }
            }}
          />
        </Box>
      </Box>
    </ListLayout>
  );
}


