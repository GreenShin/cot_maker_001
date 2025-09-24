import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button, Box, ButtonGroup, ClickAwayListener, Grow, Paper, Popper, MenuList, MenuItem } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon, ArrowDropDown } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import { ProductSearchFiltersComponent, type ProductSearchFiltersProps } from '../../components/products/ProductSearchFilters';
import { BulkImportDialog } from '../../components/common/BulkImportDialog';
import { handleExport } from '../shared/importExportActions';
import type { RootState, AppDispatch } from '../../store';
import { 
  fetchProductsWithFilters, 
  fetchAllProductsForExport,
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
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportAnchorRef = React.useRef<HTMLDivElement>(null);

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

  const handleExportFormat = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      // 전체 데이터 조회
      const result = await dispatch(fetchAllProductsForExport(filters));
      
      if (fetchAllProductsForExport.fulfilled.match(result)) {
        const allProducts = result.payload;
        await handleExport(allProducts, { format, entity: 'products' }, 
          () => {
            const formatNames = { csv: 'CSV', json: 'JSON', xlsx: 'Excel' };
            alert(`${allProducts.length}개 상품이 ${formatNames[format]} 파일로 다운로드되었습니다!`);
          },
          (error) => alert(`Export 실패: ${error}`)
        );
      } else {
        throw new Error('전체 데이터 조회 실패');
      }
    } catch (error) {
      alert(`Export 중 오류: ${error}`);
    }
    setExportMenuOpen(false);
  };

  const handleExportMenuToggle = () => {
    setExportMenuOpen((prevOpen) => !prevOpen);
  };

  const handleExportMenuClose = (event: Event | React.SyntheticEvent) => {
    if (exportAnchorRef.current && exportAnchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setExportMenuOpen(false);
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
      <ButtonGroup variant="outlined" ref={exportAnchorRef}>
        <Button startIcon={<DownloadIcon />} onClick={() => handleExportFormat('csv')}>
          Export
        </Button>
        <Button
          size="small"
          onClick={handleExportMenuToggle}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
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
        
        <Popper
          sx={{ zIndex: 1 }}
          open={exportMenuOpen}
          anchorEl={exportAnchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleExportMenuClose}>
                  <MenuList autoFocusItem>
                    <MenuItem onClick={() => handleExportFormat('csv')}>
                      CSV 파일로 내보내기
                    </MenuItem>
                    <MenuItem onClick={() => handleExportFormat('json')}>
                      JSON 파일로 내보내기
                    </MenuItem>
                    <MenuItem onClick={() => handleExportFormat('xlsx')}>
                      Excel 파일로 내보내기
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </ListLayout>
  );
}


