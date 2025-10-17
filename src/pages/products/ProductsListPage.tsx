import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button, Box } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import { ProductSearchFiltersComponent, type ProductSearchFiltersProps } from '../../components/products/ProductSearchFilters';
import { BulkImportDialog } from '../../components/common/BulkImportDialog';
import { ExportDialog } from '../../components/common/ExportDialog';
import type { RootState, AppDispatch } from '../../store';
import { 
  fetchProductsWithFilters, 
  fetchAllProductsForExport,
  setFilters,
  clearFilters,
  type ProductSearchFilters
} from '../../store/slices/productsSlice';

function useProductColumns(productSourceFilter: string): GridColDef[] {
  // 공통 컬럼
  const base: GridColDef[] = [
    { field: 'productSource', headerName: '상품출처', width: 100 },
    { field: 'productName', headerName: '상품명', width: 220, flex: 1 },
    { field: 'productCategory', headerName: '상품분류', width: 140 },
  ];

  if (productSourceFilter === '증권') {
    const securitiesCols: GridColDef[] = [
      { field: 'protectedType', headerName: '유형', width: 120 },
      { field: 'riskGrade', headerName: '위험등급(라벨)', width: 140 },
      { field: 'incomeRate6m', headerName: '6개월수익률', width: 130 },
      {
        field: 'maturity',
        headerName: '만기',
        width: 140,
        valueGetter: (params: { row: any }) => {
          const mt = params.row?.maturityType;
          const mp = params.row?.maturityPeriod;
          if (mt === '있음') return mp ? `${mt} / ${mp}` : '있음';
          if (mt === '없음') return '없음';
          return '';
        }
      },
      { field: 'paymentType', headerName: '납입형태', width: 110 },
    ];
    return [...base, ...securitiesCols];
  }

  if (productSourceFilter === '보험') {
    const insuranceCols: GridColDef[] = [
      { field: 'riderType', headerName: '특약유형', width: 120 },
      { field: 'productPeriod', headerName: '보험기간', width: 110 },
      { field: 'renewableType', headerName: '갱신형', width: 100 },
      { field: 'refundType', headerName: '해약환급', width: 100 },
      { field: 'eligibleAge', headerName: '자격연령', width: 110 },
    ];
    return [...base, ...insuranceCols];
  }

  // 필터 없음: 공통 컬럼 + 최소 정보
  return [
    ...base,
    { field: 'taxType', headerName: '세금유형', width: 100 },
    { field: 'riskLevel', headerName: '위험등급', width: 100 },
  ];
}

export function ProductsListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, loading, pagination, filters } = useSelector((state: RootState) => state.products);
  const columns = React.useMemo(() => useProductColumns(filters.productSource), [filters.productSource]);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportData, setExportData] = React.useState<any[]>([]);

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

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      // 전체 데이터 조회
      const result = await dispatch(fetchAllProductsForExport(filters));
      
      if (fetchAllProductsForExport.fulfilled.match(result)) {
        const allProducts = result.payload;
        setExportData(allProducts);
        setExportDialogOpen(true);
      } else {
        throw new Error('전체 데이터 조회 실패');
      }
    } catch (error) {
      alert(`Export 준비 중 오류: ${error}`);
    }
  };

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
      <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
        Import
      </Button>
      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
        Export
      </Button>
    </>
  );

  return (
    <ListLayout title="상품 리스트" toolbar={toolbar}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        {/* 검색 필터 */}
        <ProductSearchFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />
        
        {/* 데이터 그리드 */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            sx={{ 
              border: 0,
              height: '100%',
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              }
            }}
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
            rowBufferPx={520}
            columnBufferPx={200}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={false}
            density="standard"
          />
        </Box>
        
        <BulkImportDialog
          open={importDialogOpen}
          onClose={(shouldRefresh) => {
            setImportDialogOpen(false);
            if (shouldRefresh) {
              dispatch(fetchProductsWithFilters({ filters, page: 1, pageSize: pagination.pageSize }));
            }
          }}
          entityType="products"
          onSuccess={() => {
            // Alert 제거 - 팝업 내에서 성공 메시지 표시
          }}
          onError={(error) => {
            alert(`Import 실패: ${error}`);
          }}
        />
        
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          entityType="products"
          data={exportData}
        />
      </Box>
    </ListLayout>
  );
}


