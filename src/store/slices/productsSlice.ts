import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../models/product';
import type { PaginatedResult, QueryOptions } from '../../services/storage/storage';
import { InMemoryStorageAdapter } from '../../services/storage/storage';
import type { SearchFilters } from '../../services/query/queryService';

export interface ProductsState {
  items: Product[];
  selectedProducts: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: SearchFilters;
}

const initialState: ProductsState = {
  items: [],
  selectedProducts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  },
  filters: {}
};

const storage = new InMemoryStorageAdapter<Product>('product');

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (options: Partial<QueryOptions> = {}) => {
    return await storage.getPaginated(options);
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    const product = await storage.getById(id);
    if (!product) throw new Error(`Product with id ${id} not found`);
    return product;
  }
);

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addSelectedProduct: (state, action: PayloadAction<Product>) => {
      const exists = state.selectedProducts.find(p => p.id === action.payload.id);
      if (!exists) {
        state.selectedProducts.push(action.payload);
      }
    },
    removeSelectedProduct: (state, action: PayloadAction<string>) => {
      state.selectedProducts = state.selectedProducts.filter(p => p.id !== action.payload);
    },
    clearSelectedProducts: (state) => {
      state.selectedProducts = [];
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '상품 목록 조회 실패';
      });
  }
});

export const {
  addSelectedProduct,
  removeSelectedProduct,
  clearSelectedProducts,
  setFilters,
  setPage,
  clearError
} = productsSlice.actions;

export default productsSlice.reducer;
