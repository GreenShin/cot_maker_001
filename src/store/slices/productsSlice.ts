import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../models/product';
import type { PaginatedResult, QueryOptions } from '../../services/storage/storage';
import { storageService } from '../../services/storage/storageService';

// 상품 검색 필터 타입
export interface ProductSearchFilters {
  searchKeyword: string;
  productSource: string;
  productCategory: string;
}

export interface ProductsState {
  items: Product[];
  currentProduct: Product | null;
  selectedProducts: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ProductSearchFilters;
}

const initialState: ProductsState = {
  items: [],
  currentProduct: null,
  selectedProducts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  },
  filters: {
    searchKeyword: '',
    productSource: '',
    productCategory: '',
  }
};

// 스토리지 서비스 사용
const storage = storageService.products;

// 검색 필터를 쿼리 옵션으로 변환
const buildProductQueryOptions = (
  filters: ProductSearchFilters, 
  page: number = 1, 
  pageSize: number = 50
): QueryOptions => {
  const queryFilters: Record<string, any> = {};

  // 상품출처 필터
  if (filters.productSource) {
    queryFilters.productSource = filters.productSource;
  }

  // 상품분류 필터
  if (filters.productCategory) {
    queryFilters.productCategory = filters.productCategory;
  }

  return {
    page,
    pageSize,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    search: filters.searchKeyword, // 상품명 검색용
    filters: queryFilters,
  };
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (options: Partial<QueryOptions> = {}) => {
    return await storage.getPaginated(options);
  }
);

// 필터링된 상품 목록 조회
export const fetchProductsWithFilters = createAsyncThunk(
  'products/fetchProductsWithFilters',
  async (params: { filters: ProductSearchFilters; page?: number; pageSize?: number }) => {
    const { filters, page = 1, pageSize = 50 } = params;
    const queryOptions = buildProductQueryOptions(filters, page, pageSize);
    return await storage.getPaginated(queryOptions);
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    if (!id) return null;
    const product = await storage.getById(id);
    if (!product) throw new Error(`Product with id ${id} not found`);
    return product;
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      console.log('Creating product with data:', productData);
      const newProduct = await storage.create(productData);
      console.log('Product created successfully:', newProduct);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: string; data: Partial<Product> }, { rejectWithValue }) => {
    try {
      console.log('Updating product:', id, 'with data:', data);
      const updatedProduct = await storage.update(id, data);
      console.log('Product updated successfully:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await storage.delete(id);
      if (success) {
        return id;
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);


export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
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
    setFilters: (state, action: PayloadAction<ProductSearchFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        searchKeyword: '',
        productSource: '',
        productCategory: '',
      };
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
      })
      
      // fetchProductsWithFilters
      .addCase(fetchProductsWithFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsWithFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchProductsWithFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '상품 검색 실패';
      })
      
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '상품 조회 실패';
      })
      
      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // 새 항목을 맨 앞에 추가
        state.currentProduct = action.payload;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '상품 생성 실패';
      })
      
      // updateProduct
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '상품 수정 실패';
      })
      
      // deleteProduct
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentProduct?.id === action.payload) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '상품 삭제 실패';
      });
  }
});

export const {
  setCurrentProduct,
  addSelectedProduct,
  removeSelectedProduct,
  clearSelectedProducts,
  setFilters,
  clearFilters,
  setPage,
  clearError
} = productsSlice.actions;

export default productsSlice.reducer;
