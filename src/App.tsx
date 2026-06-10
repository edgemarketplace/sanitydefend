import {type FormEvent, useEffect, useMemo, useState} from 'react'
import './App.css'

type Slug = {current?: string}
type BlockChild = {text?: string}
type Block = {children?: BlockChild[]}
type Link = {
  label?: string
  linkType?: 'internal' | 'external'
  externalUrl?: string
  internalPage?: {_ref?: string}
}
type Cta = {label?: string; link?: Link}
type Stat = {value?: string; label?: string}
type ImageAsset = {asset?: {url?: string}}
type HeroSection = {
  eyebrow?: string
  headline?: string
  subheadline?: string
  backgroundImage?: ImageAsset
  ctaPrimary?: Cta
  ctaSecondary?: Cta
  stats?: Stat[]
}
type ProductFeature = {title?: string; description?: string}

type CollectionPage = {
  _id: string
  title?: string
  slug?: Slug
  intro?: Block[]
  hero?: HeroSection
  cardImageUrl?: string
}

type ProductPage = {
  _id: string
  title?: string
  slug?: Slug
  badgeText?: string
  featureHighlights?: ProductFeature[]
  longDescription?: Block[]
  hero?: HeroSection
  cardImageUrl?: string
}

type Page = {
  _id: string
  title?: string
  slug?: Slug
  eyebrow?: string
  hero?: HeroSection
}

type PageSection =
  | {_type: 'featuredCollectionSection'; heading?: string; subheading?: string; collections?: CollectionPage[]}
  | {_type: string}

type ContentModel = {
  siteSettings?: {
    siteTitle?: string
    tagline?: string
    announcementText?: string
    supportEmail?: string
    logo?: ImageAsset
    logoUrl?: string
  }
  navigation?: {
    headerPrimary?: Link[]
    headerFeaturedLinks?: Link[]
    footerColumns?: {title?: string; links?: Link[]}[]
    footerBottomLinks?: Link[]
  }
  homePage?: {
    title?: string
    hero?: HeroSection
    pageBuilder?: PageSection[]
  }
  pages?: Page[]
  collections?: CollectionPage[]
  products?: ProductPage[]
}

type VendureAsset = {id?: string; preview?: string; source?: string | null}
type SearchPrice = {__typename?: 'SinglePrice' | 'PriceRange'; value?: number; min?: number; max?: number}
type VendureSearchProduct = {
  productId: string
  productName: string
  slug: string
  description?: string
  currencyCode: string
  inStock: boolean
  priceWithTax?: SearchPrice
  productAsset?: VendureAsset | null
  productVariantAsset?: VendureAsset | null
}
type VendureCollection = {
  id: string
  slug: string
  name: string
  description?: string
  featuredAsset?: VendureAsset | null
}
type VendureVariantOption = {name: string; code: string; group?: {name: string; code: string}}
type VendureVariant = {
  id: string
  name: string
  sku?: string
  priceWithTax: number
  stockLevel?: string
  featuredAsset?: VendureAsset | null
  assets?: VendureAsset[]
  options?: VendureVariantOption[]
}
type VendureProductDetail = {
  id: string
  name: string
  slug: string
  description?: string
  featuredAsset?: VendureAsset | null
  assets?: VendureAsset[]
  variants: VendureVariant[]
  collections?: Pick<VendureCollection, 'id' | 'name' | 'slug'>[]
}
type VendureOrderLine = {
  id: string
  quantity: number
  linePriceWithTax: number
  featuredAsset?: VendureAsset | null
  productVariant: {id: string; name: string; sku?: string}
}
type VendureOrder = {
  id: string
  code: string
  state: string
  currencyCode: string
  subTotalWithTax: number
  shippingWithTax: number
  totalWithTax: number
  lines: VendureOrderLine[]
  shippingLines?: {priceWithTax: number; shippingMethod: {id: string; code: string; name: string}}[]
  customer?: {firstName?: string; lastName?: string; emailAddress?: string}
  shippingAddress?: AddressInput
  billingAddress?: AddressInput
}
type Country = {id: string; code: string; name: string; enabled: boolean}
type ShippingMethod = {id: string; code: string; name: string; description?: string; priceWithTax: number}
type PaymentMethod = {id: string; code: string; name: string; isEligible: boolean; eligibilityMessage?: string | null}
type AddressInput = {
  fullName: string
  streetLine1: string
  city: string
  province: string
  postalCode: string
  countryCode: string
  phoneNumber?: string
}
type CheckoutForm = {
  firstName: string
  lastName: string
  emailAddress: string
  phoneNumber: string
  fullName: string
  streetLine1: string
  city: string
  province: string
  postalCode: string
  countryCode: string
}
type Route =
  | {type: 'home'}
  | {type: 'products'}
  | {type: 'product'; slug: string}
  | {type: 'collections'}
  | {type: 'collection'; slug: string}
  | {type: 'cart'}

const SANITY_QUERY = `{
  "siteSettings": *[_id == "siteSettings"][0]{siteTitle,tagline,announcementText,supportEmail,logoUrl,logo{asset->{url}}},
  "navigation": *[_id == "navigation"][0]{headerPrimary,headerFeaturedLinks,footerColumns,footerBottomLinks},
  "homePage": *[_id == "homePage"][0]{
    title,
    hero{...,backgroundImage{asset->{url}}},
    pageBuilder[]{
      ...,
      _type == "featuredCollectionSection" => {
        ...,
        collections[]->{_id,title,slug,intro,cardImageUrl,hero{...,backgroundImage{asset->{url}}}}
      }
    }
  },
  "pages": *[_type == "page"]|order(title asc){_id,title,slug,eyebrow,hero{...,backgroundImage{asset->{url}}}},
  "collections": *[_type == "collectionPage"]|order(title asc){_id,title,slug,intro,cardImageUrl,hero{...,backgroundImage{asset->{url}}}},
  "products": *[_type == "productPage"]|order(title asc)[0..99]{_id,title,slug,badgeText,featureHighlights,longDescription,cardImageUrl,hero{...,backgroundImage{asset->{url}}}}
}`

const SANITY_URL = `/api/sanity/v2025-08-15/data/query/production?query=${encodeURIComponent(SANITY_QUERY)}`
const VENDURE_ENDPOINT = '/api/vendure'
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="%23f1f1f1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-family="Arial, sans-serif" font-size="56">Fire DFND</text></svg>'

const COLLECTIONS_QUERY = `query Collections {
  collections(options: {take: 100}) {
    items {
      id
      slug
      name
      description
      featuredAsset { id preview source }
    }
  }
}`

const PRODUCTS_QUERY = `query Products {
  search(input: {groupByProduct: true, take: 100, inStock: true}) {
    totalItems
    items {
      productId
      productName
      slug
      description
      currencyCode
      inStock
      productAsset { id preview }
      productVariantAsset { id preview }
      priceWithTax {
        __typename
        ... on SinglePrice { value }
        ... on PriceRange { min max }
      }
    }
  }
}`

const PRODUCT_QUERY = `query Product($slug: String!) {
  product(slug: $slug) {
    id
    name
    slug
    description
    featuredAsset { id preview source }
    assets { id preview source }
    collections { id name slug }
    variants {
      id
      name
      sku
      priceWithTax
      stockLevel
      featuredAsset { id preview source }
      assets { id preview source }
      options {
        name
        code
        group { name code }
      }
    }
  }
}`

const COLLECTION_QUERY = `query Collection($slug: String!) {
  collection(slug: $slug) {
    id
    slug
    name
    description
    featuredAsset { id preview source }
  }
}`

const COLLECTION_PRODUCTS_QUERY = `query CollectionProducts($slug: String!) {
  search(input: {groupByProduct: true, take: 100, inStock: true, collectionSlug: $slug}) {
    totalItems
    items {
      productId
      productName
      slug
      description
      currencyCode
      inStock
      productAsset { id preview }
      productVariantAsset { id preview }
      priceWithTax {
        __typename
        ... on SinglePrice { value }
        ... on PriceRange { min max }
      }
    }
  }
}`

const ACTIVE_ORDER_QUERY = `query ActiveOrder {
  activeOrder {
    id
    code
    state
    currencyCode
    subTotalWithTax
    shippingWithTax
    totalWithTax
    customer { firstName lastName emailAddress }
    shippingAddress { fullName streetLine1 city province postalCode countryCode phoneNumber }
    billingAddress { fullName streetLine1 city province postalCode countryCode phoneNumber }
    shippingLines {
      priceWithTax
      shippingMethod { id code name }
    }
    lines {
      id
      quantity
      linePriceWithTax
      featuredAsset { id preview source }
      productVariant { id name sku }
    }
  }
}`

const AVAILABLE_COUNTRIES_QUERY = `query Countries {
  availableCountries { id code name enabled }
}`

const ELIGIBLE_SHIPPING_METHODS_QUERY = `query ShippingMethods {
  eligibleShippingMethods { id code name description priceWithTax }
}`

const ELIGIBLE_PAYMENT_METHODS_QUERY = `query PaymentMethods {
  eligiblePaymentMethods { id code name isEligible eligibilityMessage }
}`

const ADD_ITEM_MUTATION = `mutation AddItem($productVariantId: ID!, $quantity: Int!) {
  addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
    __typename
    ... on Order {
      id
      code
      state
      currencyCode
      subTotalWithTax
      shippingWithTax
      totalWithTax
      lines {
        id
        quantity
        linePriceWithTax
        featuredAsset { id preview source }
        productVariant { id name sku }
      }
    }
    ... on ErrorResult { errorCode message }
    ... on InsufficientStockError { errorCode message quantityAvailable }
    ... on OrderLimitError { errorCode message maxItems }
    ... on NegativeQuantityError { errorCode message }
  }
}`

const ADJUST_LINE_MUTATION = `mutation AdjustLine($orderLineId: ID!, $quantity: Int!) {
  adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
    __typename
    ... on Order {
      id
      code
      state
      currencyCode
      subTotalWithTax
      shippingWithTax
      totalWithTax
      lines {
        id
        quantity
        linePriceWithTax
        featuredAsset { id preview source }
        productVariant { id name sku }
      }
    }
    ... on ErrorResult { errorCode message }
  }
}`

const REMOVE_LINE_MUTATION = `mutation RemoveLine($orderLineId: ID!) {
  removeOrderLine(orderLineId: $orderLineId) {
    ...ActiveOrderFields
  }
}
fragment ActiveOrderFields on Order {
  id
  code
  state
  currencyCode
  subTotalWithTax
  shippingWithTax
  totalWithTax
  lines {
    id
    quantity
    linePriceWithTax
    featuredAsset { id preview source }
    productVariant { id name sku }
  }
}`

const SET_CUSTOMER_MUTATION = `mutation SetCustomer($input: CreateCustomerInput!) {
  setCustomerForOrder(input: $input) {
    __typename
    ... on Order { id code state customer { firstName lastName emailAddress } }
    ... on ErrorResult { errorCode message }
  }
}`

const SET_SHIPPING_ADDRESS_MUTATION = `mutation SetShippingAddress($input: CreateAddressInput!) {
  setOrderShippingAddress(input: $input) {
    __typename
    ... on Order { id code state shippingAddress { fullName streetLine1 city province postalCode countryCode phoneNumber } }
    ... on ErrorResult { errorCode message }
  }
}`

const SET_BILLING_ADDRESS_MUTATION = `mutation SetBillingAddress($input: CreateAddressInput!) {
  setOrderBillingAddress(input: $input) {
    __typename
    ... on Order { id code state billingAddress { fullName streetLine1 city province postalCode countryCode phoneNumber } }
    ... on ErrorResult { errorCode message }
  }
}`

const SET_SHIPPING_METHOD_MUTATION = `mutation SetShippingMethod($shippingMethodId: [ID!]!) {
  setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
    __typename
    ... on Order {
      id
      code
      state
      currencyCode
      subTotalWithTax
      shippingWithTax
      totalWithTax
      shippingLines { priceWithTax shippingMethod { id code name } }
      lines {
        id
        quantity
        linePriceWithTax
        featuredAsset { id preview source }
        productVariant { id name sku }
      }
    }
    ... on ErrorResult { errorCode message }
  }
}`

const TRANSITION_ORDER_MUTATION = `mutation TransitionOrder($state: String!) {
  transitionOrderToState(state: $state) {
    __typename
    ... on Order { id code state totalWithTax }
    ... on OrderStateTransitionError { errorCode message transitionError fromState toState }
  }
}`

const ADD_PAYMENT_MUTATION = `mutation AddPayment($input: PaymentInput!) {
  addPaymentToOrder(input: $input) {
    __typename
    ... on Order {
      id
      code
      state
      totalWithTax
      payments { id method state amount metadata }
    }
    ... on ErrorResult { errorCode message }
    ... on IneligiblePaymentMethodError { errorCode message eligibilityCheckerMessage }
    ... on PaymentFailedError { errorCode message paymentErrorMessage }
  }
}`

function portableTextToPlain(blocks?: Block[]) {
  return (
    blocks
      ?.map((block) => block.children?.map((child) => child.text ?? '').join('') ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  )
}

function cleanCopy(text?: string, fallback = '') {
  if (!text) return fallback

  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/Sanity/gi, '')
    .replace(/Vendure/gi, '')
    .replace(/site data/gi, 'content')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || fallback
}

function summary(text?: string, fallback = 'Details coming soon.') {
  return text?.trim() || fallback
}

function formatMoney(amount?: number, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format((amount ?? 0) / 100)
}

function priceValue(price?: SearchPrice) {
  if (!price) return 0
  if (price.__typename === 'SinglePrice') return price.value ?? 0
  return price.min ?? 0
}

function getRoute(pathname: string): Route {
  const path = pathname === '' ? '/' : pathname
  if (path === '/') return {type: 'home'}
  if (path === '/products') return {type: 'products'}
  if (path === '/collections') return {type: 'collections'}
  if (path === '/cart') return {type: 'cart'}

  const productMatch = path.match(/^\/products\/([^/]+)$/)
  if (productMatch) return {type: 'product', slug: decodeURIComponent(productMatch[1])}

  const collectionMatch = path.match(/^\/collections\/([^/]+)$/)
  if (collectionMatch) return {type: 'collection', slug: decodeURIComponent(collectionMatch[1])}

  return {type: 'home'}
}

async function fetchSanity() {
  const response = await fetch(SANITY_URL)
  if (!response.ok) throw new Error(`Sanity request failed: ${response.status}`)
  const json = await response.json()
  return json.result as ContentModel
}

async function vendureFetch<T>(query: string, variables?: Record<string, unknown>) {
  const token = window.localStorage.getItem('vendure-auth-token')
  const headers: Record<string, string> = {'Content-Type': 'application/json'}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(VENDURE_ENDPOINT, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({query, variables: variables ?? {}}),
  })

  const nextToken = response.headers.get('vendure-auth-token')
  if (nextToken) {
    window.localStorage.setItem('vendure-auth-token', nextToken)
  }

  const json = await response.json()
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? `Vendure request failed: ${response.status}`)
  }

  return json.data as T
}

function getMutationError(result: Record<string, unknown> | null | undefined) {
  if (!result) return 'Unknown error'
  if (result.__typename && result.__typename !== 'Order') {
    return String((result as {message?: string}).message ?? 'Request failed')
  }
  return null
}

function AppLink({children, className, onNavigate, to}: {children: React.ReactNode; className?: string; onNavigate: (to: string) => void; to: string}) {
  const isExternal = /^https?:\/\//.test(to) || to.startsWith('mailto:')
  if (isExternal) {
    return (
      <a className={className} href={to} rel="noreferrer" target={to.startsWith('mailto:') ? undefined : '_blank'}>
        {children}
      </a>
    )
  }

  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        event.preventDefault()
        onNavigate(to)
      }}
    >
      {children}
    </a>
  )
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [content, setContent] = useState<ContentModel | null>(null)
  const [vendureCollections, setVendureCollections] = useState<VendureCollection[]>([])
  const [vendureProducts, setVendureProducts] = useState<VendureSearchProduct[]>([])
  const [productDetail, setProductDetail] = useState<VendureProductDetail | null>(null)
  const [collectionDetail, setCollectionDetail] = useState<VendureCollection | null>(null)
  const [collectionProducts, setCollectionProducts] = useState<VendureSearchProduct[]>([])
  const [activeOrder, setActiveOrder] = useState<VendureOrder | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)
  const [cartBusy, setCartBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null)
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    fullName: '',
    streetLine1: '',
    city: '',
    province: 'NV',
    postalCode: '',
    countryCode: '',
  })

  const route = getRoute(path)

  const sanityCollectionsBySlug = useMemo(
    () => new Map((content?.collections ?? []).map((collection) => [collection.slug?.current ?? '', collection])),
    [content?.collections],
  )
  const sanityProductsBySlug = useMemo(
    () => new Map((content?.products ?? []).map((product) => [product.slug?.current ?? '', product])),
    [content?.products],
  )
  const vendureCollectionsBySlug = useMemo(() => new Map(vendureCollections.map((collection) => [collection.slug, collection])), [vendureCollections])
  const vendureProductsBySlug = useMemo(() => new Map(vendureProducts.map((product) => [product.slug, product])), [vendureProducts])

  function navigate(to: string) {
    if (to === path) return
    window.history.pushState({}, '', to)
    window.scrollTo({top: 0, behavior: 'smooth'})
    setPath(to)
    setCartMessage(null)
    setCheckoutMessage(null)
  }

  function resolveCmsLink(link?: Link) {
    if (!link) return '#'
    if (link.linkType === 'external' && link.externalUrl) return link.externalUrl

    const ref = link.internalPage?._ref
    const label = cleanCopy(link.label).toLowerCase()
    if (!ref) {
      if (label.includes('cart')) return '/cart'
      if (label.includes('product')) return '/products'
      if (label.includes('collection')) return '/collections'
      return '#'
    }

    if (ref === 'homePage') return '/'

    const page = (content?.pages ?? []).find((item) => item._id === ref)
    const pageSlug = page?.slug?.current ?? ''
    if (pageSlug === 'collections') return '/collections'
    if (pageSlug === 'contact' && content?.siteSettings?.supportEmail) return `mailto:${content.siteSettings.supportEmail}`

    const collection = (content?.collections ?? []).find((item) => item._id === ref)
    if (collection?.slug?.current) return `/collections/${collection.slug.current}`

    if (label.includes('cart')) return '/cart'
    if (label.includes('product')) return '/products'
    if (label.includes('collection')) return '/collections'

    return '#'
  }

  function getCollectionImage(slug?: string) {
    if (!slug) return PLACEHOLDER_IMAGE
    const vendure = vendureCollectionsBySlug.get(slug)
    const sanity = sanityCollectionsBySlug.get(slug)
    return vendure?.featuredAsset?.preview ?? vendure?.featuredAsset?.source ?? sanity?.cardImageUrl ?? sanity?.hero?.backgroundImage?.asset?.url ?? PLACEHOLDER_IMAGE
  }

  function getProductImage(slug?: string, detail?: VendureProductDetail | null) {
    const product = slug ? vendureProductsBySlug.get(slug) : undefined
    const sanity = slug ? sanityProductsBySlug.get(slug) : undefined
    return (
      detail?.featuredAsset?.preview ??
      detail?.assets?.[0]?.preview ??
      detail?.variants?.[0]?.featuredAsset?.preview ??
      detail?.variants?.[0]?.assets?.[0]?.preview ??
      product?.productVariantAsset?.preview ??
      product?.productAsset?.preview ??
      sanity?.cardImageUrl ??
      sanity?.hero?.backgroundImage?.asset?.url ??
      PLACEHOLDER_IMAGE
    )
  }

  async function refreshActiveOrder() {
    const data = await vendureFetch<{activeOrder: VendureOrder | null}>(ACTIVE_ORDER_QUERY)
    setActiveOrder(data.activeOrder)
    return data.activeOrder
  }

  useEffect(() => {
    async function loadStorefront() {
      try {
        setLoading(true)
        const [sanity, collectionData, productData, orderData, countryData] = await Promise.all([
          fetchSanity(),
          vendureFetch<{collections: {items: VendureCollection[]}}>(COLLECTIONS_QUERY),
          vendureFetch<{search: {items: VendureSearchProduct[]}}>(PRODUCTS_QUERY),
          vendureFetch<{activeOrder: VendureOrder | null}>(ACTIVE_ORDER_QUERY),
          vendureFetch<{availableCountries: Country[]}>(AVAILABLE_COUNTRIES_QUERY),
        ])

        setContent(sanity)
        setVendureCollections(collectionData.collections.items)
        setVendureProducts(productData.search.items)
        setActiveOrder(orderData.activeOrder)
        setCountries(countryData.availableCountries.filter((country) => country.enabled))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void loadStorefront()
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!countries.length) return
    setCheckoutForm((current) => ({
      ...current,
      countryCode: current.countryCode || countries[0].code,
    }))
  }, [countries])

  useEffect(() => {
    if (!activeOrder?.customer && !activeOrder?.shippingAddress) return
    setCheckoutForm((current) => ({
      ...current,
      firstName: current.firstName || activeOrder.customer?.firstName || '',
      lastName: current.lastName || activeOrder.customer?.lastName || '',
      emailAddress: current.emailAddress || activeOrder.customer?.emailAddress || '',
      phoneNumber: current.phoneNumber || activeOrder.shippingAddress?.phoneNumber || '',
      fullName: current.fullName || activeOrder.shippingAddress?.fullName || `${activeOrder.customer?.firstName ?? ''} ${activeOrder.customer?.lastName ?? ''}`.trim(),
      streetLine1: current.streetLine1 || activeOrder.shippingAddress?.streetLine1 || '',
      city: current.city || activeOrder.shippingAddress?.city || '',
      province: current.province || activeOrder.shippingAddress?.province || '',
      postalCode: current.postalCode || activeOrder.shippingAddress?.postalCode || '',
      countryCode: current.countryCode || activeOrder.shippingAddress?.countryCode || current.countryCode,
    }))
  }, [activeOrder])

  useEffect(() => {
    async function loadRouteData() {
      try {
        setRouteLoading(true)
        setProductDetail(null)
        setCollectionDetail(null)
        setCollectionProducts([])

        if (route.type === 'product') {
          const data = await vendureFetch<{product: VendureProductDetail | null}>(PRODUCT_QUERY, {slug: route.slug})
          setProductDetail(data.product)
          setSelectedVariantId(data.product?.variants?.[0]?.id ?? '')
        }

        if (route.type === 'collection') {
          const [collectionData, productData] = await Promise.all([
            vendureFetch<{collection: VendureCollection | null}>(COLLECTION_QUERY, {slug: route.slug}),
            vendureFetch<{search: {items: VendureSearchProduct[]}}>(COLLECTION_PRODUCTS_QUERY, {slug: route.slug}),
          ])
          setCollectionDetail(collectionData.collection)
          setCollectionProducts(productData.search.items)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load route data')
      } finally {
        setRouteLoading(false)
      }
    }

    void loadRouteData()
  }, [route.type, route.type === 'product' ? route.slug : '', route.type === 'collection' ? route.slug : ''])

  useEffect(() => {
    async function loadCheckoutMethods() {
      if (!activeOrder?.lines.length) {
        setShippingMethods([])
        setPaymentMethods([])
        setSelectedShippingMethodId('')
        return
      }

      try {
        const [shippingData, paymentData] = await Promise.all([
          vendureFetch<{eligibleShippingMethods: ShippingMethod[]}>(ELIGIBLE_SHIPPING_METHODS_QUERY),
          vendureFetch<{eligiblePaymentMethods: PaymentMethod[]}>(ELIGIBLE_PAYMENT_METHODS_QUERY),
        ])
        setShippingMethods(shippingData.eligibleShippingMethods)
        setPaymentMethods(paymentData.eligiblePaymentMethods.filter((method) => method.isEligible))
        setSelectedShippingMethodId((current) => current || shippingData.eligibleShippingMethods[0]?.id || '')
      } catch {
        setShippingMethods([])
        setPaymentMethods([])
      }
    }

    void loadCheckoutMethods()
  }, [activeOrder?.id, activeOrder?.lines.length])

  async function addToCart(product: VendureProductDetail, variantId: string) {
    try {
      setCartBusy(true)
      setCartMessage(null)
      const data = await vendureFetch<{addItemToOrder: Record<string, unknown>}>(ADD_ITEM_MUTATION, {
        productVariantId: variantId,
        quantity: 1,
      })
      const mutationError = getMutationError(data.addItemToOrder)
      if (mutationError) throw new Error(mutationError)
      await refreshActiveOrder()
      setCartMessage(`${cleanCopy(product.name)} added to cart.`)
      navigate('/cart')
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Unable to add to cart')
    } finally {
      setCartBusy(false)
    }
  }

  async function updateLineQuantity(orderLineId: string, quantity: number) {
    try {
      setCartBusy(true)
      setCartMessage(null)
      if (quantity <= 0) {
        await vendureFetch(REMOVE_LINE_MUTATION, {orderLineId})
      } else {
        const data = await vendureFetch<{adjustOrderLine: Record<string, unknown>}>(ADJUST_LINE_MUTATION, {orderLineId, quantity})
        const mutationError = getMutationError(data.adjustOrderLine)
        if (mutationError) throw new Error(mutationError)
      }
      await refreshActiveOrder()
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Unable to update cart')
    } finally {
      setCartBusy(false)
    }
  }

  async function completeCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeOrder?.lines.length) return

    try {
      setCheckoutBusy(true)
      setCheckoutMessage(null)
      setCompletedOrderCode(null)

      const customerInput = {
        firstName: checkoutForm.firstName,
        lastName: checkoutForm.lastName,
        emailAddress: checkoutForm.emailAddress,
        phoneNumber: checkoutForm.phoneNumber || undefined,
      }

      const addressInput: AddressInput = {
        fullName: checkoutForm.fullName,
        streetLine1: checkoutForm.streetLine1,
        city: checkoutForm.city,
        province: checkoutForm.province,
        postalCode: checkoutForm.postalCode,
        countryCode: checkoutForm.countryCode,
        phoneNumber: checkoutForm.phoneNumber || undefined,
      }

      const customerData = await vendureFetch<{setCustomerForOrder: Record<string, unknown>}>(SET_CUSTOMER_MUTATION, {input: customerInput})
      const customerError = getMutationError(customerData.setCustomerForOrder)
      if (customerError) throw new Error(customerError)

      const shippingAddressData = await vendureFetch<{setOrderShippingAddress: Record<string, unknown>}>(SET_SHIPPING_ADDRESS_MUTATION, {input: addressInput})
      const shippingAddressError = getMutationError(shippingAddressData.setOrderShippingAddress)
      if (shippingAddressError) throw new Error(shippingAddressError)

      const billingAddressData = await vendureFetch<{setOrderBillingAddress: Record<string, unknown>}>(SET_BILLING_ADDRESS_MUTATION, {input: addressInput})
      const billingAddressError = getMutationError(billingAddressData.setOrderBillingAddress)
      if (billingAddressError) throw new Error(billingAddressError)

      const shippingMethodId = selectedShippingMethodId || shippingMethods[0]?.id
      if (!shippingMethodId) throw new Error('No shipping method available')

      const shippingMethodData = await vendureFetch<{setOrderShippingMethod: Record<string, unknown>}>(SET_SHIPPING_METHOD_MUTATION, {
        shippingMethodId: [shippingMethodId],
      })
      const shippingMethodError = getMutationError(shippingMethodData.setOrderShippingMethod)
      if (shippingMethodError) throw new Error(shippingMethodError)

      const transitionData = await vendureFetch<{transitionOrderToState: Record<string, unknown>}>(TRANSITION_ORDER_MUTATION, {state: 'ArrangingPayment'})
      const transitionError = getMutationError(transitionData.transitionOrderToState)
      if (transitionError) throw new Error(transitionError)

      const paymentMethodCode = paymentMethods[0]?.code ?? 'standard-payment'
      const paymentData = await vendureFetch<{addPaymentToOrder: Record<string, unknown>}>(ADD_PAYMENT_MUTATION, {
        input: {method: paymentMethodCode, metadata: {}},
      })
      const paymentError = getMutationError(paymentData.addPaymentToOrder)
      if (paymentError) throw new Error(paymentError)

      const completedOrder = paymentData.addPaymentToOrder as {code?: string; state?: string}
      setCompletedOrderCode(completedOrder.code ?? null)
      setCheckoutMessage(`Order ${completedOrder.code ?? ''} completed and settled.`.trim())
      await refreshActiveOrder()
    } catch (err) {
      setCheckoutMessage(err instanceof Error ? err.message : 'Unable to complete checkout')
    } finally {
      setCheckoutBusy(false)
    }
  }

  if (loading) {
    return <div className="status-shell">Loading Fire DFND…</div>
  }

  if (error || !content) {
    return <div className="status-shell error">Unable to load Fire DFND: {error ?? 'Missing content'}</div>
  }

  const storefrontContent = content

  const featuredCollectionsSection = storefrontContent.homePage?.pageBuilder?.find(
    (section): section is Extract<PageSection, {_type: 'featuredCollectionSection'}> => section._type === 'featuredCollectionSection',
  )

  const cartItemCount = activeOrder?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0
  const currentProduct = route.type === 'product' ? productDetail : null
  const currentCollection = route.type === 'collection' ? collectionDetail : null
  const currentVariant = currentProduct?.variants.find((variant) => variant.id === selectedVariantId) ?? currentProduct?.variants[0] ?? null

  function renderCollectionCards(items: CollectionPage[]) {
    return (
      <div className="card-grid collection-grid">
        {items.map((collection) => (
          <article className="card" key={collection._id}>
            <AppLink className="card-link" onNavigate={navigate} to={`/collections/${collection.slug?.current ?? ''}`}>
              <div className="card-media">
                <img alt={cleanCopy(collection.title)} src={getCollectionImage(collection.slug?.current)} />
              </div>
              <p className="eyebrow">Collection</p>
              <h3>{cleanCopy(collection.title)}</h3>
              <p>
                {summary(
                  cleanCopy(portableTextToPlain(collection.intro) || vendureCollectionsBySlug.get(collection.slug?.current ?? '')?.description || collection.hero?.subheadline),
                  'A focused collection for duty, off-duty, and team gear.',
                )}
              </p>
            </AppLink>
          </article>
        ))}
      </div>
    )
  }

  function renderProductCards(items: VendureSearchProduct[]) {
    return (
      <div className="card-grid product-grid">
        {items.map((product) => {
          const editorial = sanityProductsBySlug.get(product.slug)
          return (
            <article className="card" key={product.productId}>
              <AppLink className="card-link" onNavigate={navigate} to={`/products/${product.slug}`}>
                <div className="card-media product-media">
                  <img alt={cleanCopy(product.productName)} src={getProductImage(product.slug)} />
                </div>
                <p className="eyebrow">Product</p>
                <h3>{cleanCopy(product.productName)}</h3>
                <p>{summary(cleanCopy(portableTextToPlain(editorial?.longDescription) || editorial?.hero?.subheadline || product.description), 'Ready to order.')}</p>
                <strong className="price-tag">{formatMoney(priceValue(product.priceWithTax), product.currencyCode)}</strong>
              </AppLink>
            </article>
          )
        })}
      </div>
    )
  }

  function renderHome() {
    return (
      <>
        <section
          className="hero-panel"
          style={storefrontContent.homePage?.hero?.backgroundImage?.asset?.url ? {backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${storefrontContent.homePage.hero.backgroundImage.asset.url})`} : undefined}
        >
          <div className="hero-copy hero-overlay-copy">
            {storefrontContent.homePage?.hero?.eyebrow ? <p className="eyebrow">{cleanCopy(storefrontContent.homePage.hero.eyebrow)}</p> : null}
            <h1>{cleanCopy(storefrontContent.homePage?.hero?.headline, storefrontContent.siteSettings?.siteTitle ?? 'Fire DFND')}</h1>
            <p className="hero-text">{cleanCopy(storefrontContent.homePage?.hero?.subheadline, storefrontContent.siteSettings?.tagline)}</p>
            <div className="cta-row">
              <AppLink className="button primary" onNavigate={navigate} to="/products">
                All Products
              </AppLink>
              <AppLink className="button secondary" onNavigate={navigate} to="/collections">
                Shop Collections
              </AppLink>
            </div>
          </div>
        </section>

        {featuredCollectionsSection?.collections?.length ? (
          <section className="content-section">
            <div className="section-heading">
              <p className="eyebrow">Collections</p>
              <h2>{cleanCopy(featuredCollectionsSection.heading, 'Featured collections')}</h2>
              <p>{cleanCopy(featuredCollectionsSection.subheading, 'A focused set of collections for duty, off-duty, and team gear.')}</p>
            </div>
            {renderCollectionCards(featuredCollectionsSection.collections)}
          </section>
        ) : null}
      </>
    )
  }

  function renderCollectionsIndex() {
    const collectionsToRender = featuredCollectionsSection?.collections?.length ? featuredCollectionsSection.collections : storefrontContent.collections ?? []
    return (
      <section className="content-section page-shell">
        <div className="section-heading page-heading">
          <p className="eyebrow">Collections</p>
          <h1>Shop Collections</h1>
          <p>Collection images now come directly from Vendure so the merchandising layer matches the live catalog.</p>
        </div>
        {renderCollectionCards(collectionsToRender)}
      </section>
    )
  }

  function renderCollectionDetail() {
    const editorial = route.type === 'collection' ? sanityCollectionsBySlug.get(route.slug) : undefined
    if (routeLoading) return <div className="status-shell small">Loading collection…</div>
    if (!currentCollection) return <div className="status-shell small error">Collection not found.</div>

    return (
      <section className="page-shell detail-shell">
        <div className="detail-hero detail-hero-collection">
          <div>
            <p className="eyebrow">Collection</p>
            <h1>{cleanCopy(editorial?.title || currentCollection.name)}</h1>
            <p>{summary(cleanCopy(portableTextToPlain(editorial?.intro) || currentCollection.description || editorial?.hero?.subheadline), 'A focused collection for team and everyday wear.')}</p>
            <div className="cta-row left">
              <AppLink className="button primary" onNavigate={navigate} to="/products">
                Browse All Products
              </AppLink>
              <AppLink className="button secondary" onNavigate={navigate} to="/cart">
                View Cart
              </AppLink>
            </div>
          </div>
          <div className="detail-media wide">
            <img alt={cleanCopy(currentCollection.name)} src={getCollectionImage(currentCollection.slug)} />
          </div>
        </div>

        <div className="section-heading compact">
          <h2>Products in this collection</h2>
          <p>{collectionProducts.length} products available.</p>
        </div>
        {renderProductCards(collectionProducts)}
      </section>
    )
  }

  function renderProductsIndex() {
    return (
      <section className="content-section page-shell">
        <div className="section-heading page-heading">
          <p className="eyebrow">Catalog</p>
          <h1>All Products</h1>
          <p>Every product shown here is live from Vendure, with active product pages and checkout.</p>
        </div>
        {renderProductCards(vendureProducts)}
      </section>
    )
  }

  function renderProductDetail() {
    const editorial = route.type === 'product' ? sanityProductsBySlug.get(route.slug) : undefined
    if (routeLoading) return <div className="status-shell small">Loading product…</div>
    if (!currentProduct || !currentVariant) return <div className="status-shell small error">Product not found.</div>

    return (
      <section className="page-shell detail-shell">
        <div className="detail-hero">
          <div className="detail-media">
            <img alt={cleanCopy(currentProduct.name)} src={getProductImage(currentProduct.slug, currentProduct)} />
          </div>
          <div className="detail-copy">
            <p className="eyebrow">Product</p>
            <h1>{cleanCopy(currentProduct.name)}</h1>
            <strong className="detail-price">{formatMoney(currentVariant.priceWithTax, 'USD')}</strong>
            <p>{summary(cleanCopy(portableTextToPlain(editorial?.longDescription) || editorial?.hero?.subheadline || currentProduct.description), 'Ready to order.')}</p>

            {currentProduct.variants.length > 1 ? (
              <div className="variant-group">
                <span className="variant-label">Choose a variant</span>
                <div className="variant-options">
                  {currentProduct.variants.map((variant) => (
                    <button
                      className={variant.id === currentVariant.id ? 'variant-option active' : 'variant-option'}
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      type="button"
                    >
                      {cleanCopy(variant.name)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="product-meta">
              <span>SKU: {currentVariant.sku || 'N/A'}</span>
              <span>{currentVariant.stockLevel === 'IN_STOCK' ? 'In stock' : cleanCopy(currentVariant.stockLevel, 'Available')}</span>
            </div>

            {editorial?.featureHighlights?.length ? (
              <ul className="feature-list">
                {editorial.featureHighlights.map((feature) => (
                  <li key={`${feature.title}-${feature.description}`}>
                    <strong>{cleanCopy(feature.title)}</strong>
                    <span>{cleanCopy(feature.description)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="cta-row left top-gap">
              <button className="button primary" disabled={cartBusy} onClick={() => void addToCart(currentProduct, currentVariant.id)} type="button">
                {cartBusy ? 'Adding…' : 'Add to Cart'}
              </button>
              <AppLink className="button secondary" onNavigate={navigate} to="/cart">
                Go to Cart
              </AppLink>
            </div>
            {cartMessage ? <p className="message">{cartMessage}</p> : null}
          </div>
        </div>
      </section>
    )
  }

  function renderCart() {
    return (
      <section className="page-shell cart-shell">
        <div className="section-heading page-heading left-aligned">
          <p className="eyebrow">Checkout</p>
          <h1>Cart</h1>
          <p>The cart and checkout steps below are running against the Vendure Shop API.</p>
        </div>

        {!activeOrder?.lines.length ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add products from the catalog to begin checkout.</p>
            <AppLink className="button primary" onNavigate={navigate} to="/products">
              Shop All Products
            </AppLink>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-lines">
              {activeOrder.lines.map((line) => (
                <article className="cart-line" key={line.id}>
                  <div className="cart-line-media">
                    <img alt={cleanCopy(line.productVariant.name)} src={line.featuredAsset?.preview || getProductImage(vendureProducts.find((item) => item.productId === line.productVariant.id)?.slug)} />
                  </div>
                  <div className="cart-line-copy">
                    <h3>{cleanCopy(line.productVariant.name)}</h3>
                    <p>{line.productVariant.sku ? `SKU ${line.productVariant.sku}` : 'Vendure line item'}</p>
                    <strong>{formatMoney(line.linePriceWithTax, activeOrder.currencyCode)}</strong>
                  </div>
                  <div className="cart-line-actions">
                    <button disabled={cartBusy} onClick={() => void updateLineQuantity(line.id, line.quantity - 1)} type="button">
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button disabled={cartBusy} onClick={() => void updateLineQuantity(line.id, line.quantity + 1)} type="button">
                      +
                    </button>
                  </div>
                </article>
              ))}
              {cartMessage ? <p className="message">{cartMessage}</p> : null}
            </div>

            <div className="checkout-panel">
              <div className="order-summary">
                <div><span>Subtotal</span><strong>{formatMoney(activeOrder.subTotalWithTax, activeOrder.currencyCode)}</strong></div>
                <div><span>Shipping</span><strong>{formatMoney(activeOrder.shippingWithTax, activeOrder.currencyCode)}</strong></div>
                <div className="total-row"><span>Total</span><strong>{formatMoney(activeOrder.totalWithTax, activeOrder.currencyCode)}</strong></div>
              </div>

              <form className="checkout-form" onSubmit={(event) => void completeCheckout(event)}>
                <div className="field-grid two-up">
                  <label>
                    <span>First name</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, firstName: event.target.value, fullName: `${event.target.value} ${current.lastName}`.trim()}))} required value={checkoutForm.firstName} />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, lastName: event.target.value, fullName: `${current.firstName} ${event.target.value}`.trim()}))} required value={checkoutForm.lastName} />
                  </label>
                </div>
                <div className="field-grid two-up">
                  <label>
                    <span>Email</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, emailAddress: event.target.value}))} required type="email" value={checkoutForm.emailAddress} />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, phoneNumber: event.target.value}))} value={checkoutForm.phoneNumber} />
                  </label>
                </div>
                <label>
                  <span>Street address</span>
                  <input onChange={(event) => setCheckoutForm((current) => ({...current, streetLine1: event.target.value}))} required value={checkoutForm.streetLine1} />
                </label>
                <div className="field-grid three-up">
                  <label>
                    <span>City</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, city: event.target.value}))} required value={checkoutForm.city} />
                  </label>
                  <label>
                    <span>State</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, province: event.target.value}))} required value={checkoutForm.province} />
                  </label>
                  <label>
                    <span>ZIP</span>
                    <input onChange={(event) => setCheckoutForm((current) => ({...current, postalCode: event.target.value}))} required value={checkoutForm.postalCode} />
                  </label>
                </div>
                <label>
                  <span>Country</span>
                  <select onChange={(event) => setCheckoutForm((current) => ({...current, countryCode: event.target.value}))} value={checkoutForm.countryCode}>
                    {countries.map((country) => (
                      <option key={country.id} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Shipping method</span>
                  <select onChange={(event) => setSelectedShippingMethodId(event.target.value)} value={selectedShippingMethodId}>
                    {shippingMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} · {formatMoney(method.priceWithTax, activeOrder.currencyCode)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="checkout-note">
                  <span>Payment method</span>
                  <strong>{paymentMethods[0]?.name ?? 'Stripe'}</strong>
                </div>
                <button className="button primary" disabled={checkoutBusy} type="submit">
                  {checkoutBusy ? 'Completing…' : 'Complete Checkout'}
                </button>
                {checkoutMessage ? <p className="message">{checkoutMessage}</p> : null}
                {completedOrderCode ? <p className="success-note">Order code: {completedOrderCode}</p> : null}
              </form>
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="app-shell" id="top">
      {storefrontContent.siteSettings?.announcementText ? <div className="announcement-bar">{cleanCopy(storefrontContent.siteSettings.announcementText)}</div> : null}

      <header className="site-header">
        <AppLink className="brand" onNavigate={navigate} to="/">
          {storefrontContent.siteSettings?.logo?.asset?.url || storefrontContent.siteSettings?.logoUrl ? (
            <img alt="Fire DFND" className="brand-logo" src={storefrontContent.siteSettings.logo?.asset?.url ?? storefrontContent.siteSettings.logoUrl} />
          ) : (
            <span className="brand-mark">Fire DFND</span>
          )}
        </AppLink>

        <nav className="header-nav" aria-label="Primary">
          {(storefrontContent.navigation?.headerPrimary ?? []).slice(0, 3).map((link) => (
            <AppLink className="nav-link" key={`${link.label}-${resolveCmsLink(link)}`} onNavigate={navigate} to={resolveCmsLink(link)}>
              {cleanCopy(link.label)}
            </AppLink>
          ))}
          <AppLink className="nav-link" onNavigate={navigate} to="/products">
            Products
          </AppLink>
        </nav>

        <div className="header-actions" aria-label="Utility links">
          <AppLink className="nav-link" onNavigate={navigate} to="/collections">
            Collections
          </AppLink>
          <AppLink className="nav-link cart-link" onNavigate={navigate} to="/cart">
            Cart <span className="cart-count">{cartItemCount}</span>
          </AppLink>
        </div>
      </header>

      <main>
        {route.type === 'home' ? renderHome() : null}
        {route.type === 'collections' ? renderCollectionsIndex() : null}
        {route.type === 'collection' ? renderCollectionDetail() : null}
        {route.type === 'products' ? renderProductsIndex() : null}
        {route.type === 'product' ? renderProductDetail() : null}
        {route.type === 'cart' ? renderCart() : null}
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          {(storefrontContent.navigation?.footerColumns ?? []).map((column) => (
            <div key={column.title}>
              <h3>{cleanCopy(column.title)}</h3>
              <div className="footer-links">
                {(column.links ?? []).map((link) => (
                  <AppLink className="footer-link" key={`${link.label}-${resolveCmsLink(link)}`} onNavigate={navigate} to={resolveCmsLink(link)}>
                    {cleanCopy(link.label)}
                  </AppLink>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3>Shop</h3>
            <div className="footer-links">
              <AppLink className="footer-link" onNavigate={navigate} to="/collections">
                Collections
              </AppLink>
              <AppLink className="footer-link" onNavigate={navigate} to="/products">
                All Products
              </AppLink>
              <AppLink className="footer-link" onNavigate={navigate} to="/cart">
                Cart
              </AppLink>
              {storefrontContent.siteSettings?.supportEmail ? <a className="footer-link" href={`mailto:${storefrontContent.siteSettings.supportEmail}`}>{storefrontContent.siteSettings.supportEmail}</a> : null}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
