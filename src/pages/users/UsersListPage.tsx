import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import type { RootState, AppDispatch } from '../../store';
import { fetchUsers } from '../../store/slices/usersSlice';

const columns: GridColDef[] = [
  { field: 'customerSource', headerName: '고객출처', width: 100 },
  { field: 'ageGroup', headerName: '연령대', width: 100 },
  { field: 'gender', headerName: '성별', width: 80 },
  { field: 'investmentTendency', headerName: '투자성향', width: 150 },
  { field: 'investmentAmount', headerName: '투자액', width: 150 },
];

export function UsersListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, pagination } = useSelector((state: RootState) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
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
    <ListLayout title="질문자 리스트" toolbar={toolbar}>
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
        sx={{ border: 0 }}
      />
    </ListLayout>
  );
}


