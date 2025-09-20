import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import type { RootState, AppDispatch } from '../../store';
import { fetchProducts } from '../../store/slices/productsSlice';

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
  const { items, loading, pagination } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const toolbar = (
    <>
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
        // 성능 최적화 옵션
        rowBuffer={10}
        columnBuffer={4}
        rowHeight={52}
        disableVirtualization={false}
        keepNonExistentRowsSelected={false}
        density="standard"
        sx={{ border: 0 }}
      />
    </ListLayout>
  );
}


