import PropTypes from 'prop-types'
import React, { useMemo } from 'react'
import { graphql } from 'react-apollo'
import { Loading, useTreePath } from 'vtex.render-runtime'
import { useDevice } from 'vtex.device-detector'
import { useCssHandles } from 'vtex.css-handles'
import { ProductListContext } from 'vtex.product-list-context'

import OrdenationTypes, { getOrdenationValues } from './utils/OrdenationTypes'
import ProductList from './components/ProductList'
import {
  productListSchemaPropTypes,
  shelfContentPropTypes,
} from './utils/propTypes'
import productsQuery from './queries/productsQuery.gql'
import { normalizeBuyable } from './utils/normalize'

const CSS_HANDLES = ['container']

const { ProductListProvider } = ProductListContext

/**
 * Shelf Component. Queries a list of products and shows them.
 */
const Shelf = props => {
  const {
    data,
    paginationDotsVisibility = 'visible',
    maxItems,
    productList = ProductList.defaultProps,
    installmentCriteria = 'MAX_WITHOUT_INTEREST'
  } = props
  let { trackingId } = props
  const treePath = useTreePath()
  const handles = useCssHandles(CSS_HANDLES)
  const { isMobile } = useDevice()
  const { loading, error, products } = data || {}
  if (!trackingId) {
    // Taking the block name to pass to listName if no trackingId is passed
    const treePathList =
      (typeof treePath === 'string' && treePath.split()) || []
    trackingId = treePathList[treePathList.length - 1] || 'List of products'
  }

  const filteredProducts = useMemo(() => {
    return products && products.map(normalizeBuyable).filter(Boolean)
  }, [products])

  const productListProps = {
    ...productList,
    maxItems,
    isMobile,
    loading,
    paginationDotsVisibility,
    products: filteredProducts,
    trackingId,
    installmentCriteria
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return null
  }

  return (
    <div className={`${handles.container} pv4 pb9`}>
      <ProductListProvider listName={trackingId}>
        <ProductList {...productListProps} />
      </ProductListProvider>
    </div>
  )
}

Shelf.propTypes = {
  /** Graphql data response. */
  data: PropTypes.shape({
    products: shelfContentPropTypes.products,
  }),
  /** Category Id. */
  category: PropTypes.string,
  /** Collection Id. */
  collection: PropTypes.string,
  /** Ordenation Type. */
  orderBy: PropTypes.oneOf(getOrdenationValues()),
  /** Hide unavailable items */
  hideUnavailableItems: PropTypes.bool,
  /** Should display navigation dots below the Shelf */
  paginationDotsVisibility: PropTypes.oneOf([
    'visible',
    'hidden',
    'mobileOnly',
    'desktopOnly',
  ]),
  /** ProductList schema configuration */
  productList: PropTypes.shape(productListSchemaPropTypes),
  trackingId: PropTypes.string,
  maxItems: PropTypes.number,
  /**
   * Control what price to be shown when price has different installments options.
   * @default "MAX_WITHOUT_INTEREST"
   */
   installmentCriteria: 'MAX_WITHOUT_INTEREST' | 'MAX_WITH_INTEREST'
}

const parseFilters = ({ id, value }) => `specificationFilter_${id}:${value}`

const toBoolean = x => (typeof x === 'boolean' ? x : x === 'true')

const options = {
  options: ({
    category,
    collection,
    hideUnavailableItems,
    orderBy = OrdenationTypes.ORDER_BY_TOP_SALE_DESC.value,
    specificationFilters = [],
    maxItems = ProductList.defaultProps.maxItems,
    skusFilter,
    installmentCriteria
  }) => ({
    ssr: true,
    variables: {
      ...(category && { category: category.toString() }),
      ...(collection && { collection: collection.toString() }),
      specificationFilters: specificationFilters.map(parseFilters),
      orderBy,
      from: 0,
      to: maxItems - 1,
      hideUnavailableItems: toBoolean(hideUnavailableItems),
      skusFilter,
      installmentCriteria
    },
  }),
}

const EnhancedShelf = graphql(productsQuery, options)(Shelf)

EnhancedShelf.schema = {
  title: 'admin/editor.shelf.title',
}

export default EnhancedShelf
