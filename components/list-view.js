/*
 * 整合了FlatList和SectionList的长列表
 * @Author: czy0729
 * @Date: 2019-04-11 00:46:28
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-01-19 17:21:10
 */
import React from 'react'
import {
  FlatList,
  RefreshControl,
  SectionList,
  TouchableOpacity,
  View
} from 'react-native'
import { observer } from 'mobx-react'
import { ActivityIndicator } from '@ant-design/react-native'
import { _, systemStore } from '@stores'
import { sleep, date, simpleTime } from '@utils'
import { randomSpeech } from '@constants/speech'
import { LIST_EMPTY } from '@constants'
import Flex from './flex'
import Mesume from './mesume'
import Text from './text'

const RefreshState = {
  Idle: 0,
  HeaderRefreshing: 1,
  FooterRefreshing: 2,
  NoMoreData: 3,
  Failure: 4,
  EmptyData: 5
}

export default
@observer
class ListView extends React.Component {
  static defaultProps = {
    style: undefined,
    keyExtractor: undefined,
    data: LIST_EMPTY,
    sectionKey: '', // 当有此值, 根据item[section]构造<SectionList>的sections
    sections: undefined,
    progressViewOffset: undefined,
    refreshControlProps: {},
    renderItem: undefined,
    footerRefreshingText: '玩命加载中 >.<',
    footerFailureText: '居然失败了 =.=!',
    footerNoMoreDataText: '到底啦',
    footerEmptyDataText: '好像什么都没有',
    optimize: true, // 是否开启长列表优化
    onHeaderRefresh: undefined,
    onFooterRefresh: undefined
  }

  state = {
    refreshState: RefreshState.Idle
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps
    const { list = [], pagination = {}, _loaded } = data
    let refreshState

    if (!_loaded) {
      refreshState = RefreshState.Idle
    } else if (list.length === 0) {
      refreshState = RefreshState.EmptyData
    } else if (pagination.page < pagination.pageTotal) {
      refreshState = RefreshState.Idle
    } else {
      refreshState = RefreshState.NoMoreData
    }

    if (refreshState !== undefined) {
      this.setState({
        refreshState
      })
    }
  }

  scrollToIndex = Function.prototype
  scrollToItem = Function.prototype
  scrollToOffset = Function.prototype

  onHeaderRefresh = async () => {
    const { onHeaderRefresh } = this.props
    if (onHeaderRefresh) {
      this.setState({
        refreshState: RefreshState.HeaderRefreshing
      })
      await sleep(640)
      onHeaderRefresh()
    }
  }

  onFooterRefresh = async () => {
    const { onFooterRefresh } = this.props
    if (onFooterRefresh) {
      this.setState({
        refreshState: RefreshState.FooterRefreshing
      })
      await sleep(640)
      onFooterRefresh()
    }
  }

  onEndReached = () => {
    if (this.shouldStartFooterRefreshing()) {
      this.onFooterRefresh()
    }
  }

  shouldStartHeaderRefreshing = () => {
    const { refreshState } = this.state
    if (
      refreshState == RefreshState.HeaderRefreshing ||
      refreshState == RefreshState.FooterRefreshing
    ) {
      return false
    }
    return true
  }

  shouldStartFooterRefreshing = () => {
    const { refreshState } = this.state
    return refreshState === RefreshState.Idle
  }

  connectRef = ref => {
    if (ref) {
      this.scrollToIndex = params => ref.scrollToIndex(params)
      this.scrollToItem = params => ref.scrollToItem(params)
      this.scrollToOffset = params => ref.scrollToOffset(params)
    }
  }

  get style() {
    const { style } = this.props
    return [this.styles.container, style]
  }

  get commonProps() {
    const { optimize } = this.props
    const { refreshState } = this.state
    return {
      ref: this.connectRef,
      style: this.style,
      initialNumToRender: 10,

      // 安卓默认为true, iOS为false, false时列表的Text才能自由选择复制
      // removeClippedSubviews: false,

      refreshing: refreshState === RefreshState.HeaderRefreshing,
      refreshControl: this.renderRefreshControl(),
      ListFooterComponent: this.renderFooter(refreshState),
      onRefresh: this.onHeaderRefresh,
      onEndReached: this.onEndReached,
      onEndReachedThreshold: 0.64,

      // optimize
      windowSize: optimize ? 4 : undefined,
      maxToRenderPerBatch: optimize ? 10 : undefined,
      updateCellsBatchingPeriod: optimize ? 32 : undefined
    }
  }

  get section() {
    const { data, sectionKey, sections } = this.props
    let _sections = []
    if (sections) {
      _sections = sections.slice()
    } else {
      const sectionsMap = {}
      data.list.slice().forEach(item => {
        const title = item[sectionKey]
        if (sectionsMap[title] === undefined) {
          sectionsMap[title] = _sections.length
          _sections.push({
            title,
            data: [item]
          })
        } else {
          _sections[sectionsMap[title]].data.push(item)
        }
      })
    }
    return _sections
  }

  get data() {
    const { data } = this.props
    return Array.isArray(data.list) ? data.list : data.list.slice()
  }

  renderFooter(refreshState) {
    let footer = null
    const {
      data,
      footerRefreshingText,
      footerFailureText,
      // footerNoMoreDataText,
      footerEmptyDataText,
      footerRefreshingComponent,
      footerFailureComponent,
      footerNoMoreDataComponent,
      footerEmptyDataComponent,
      onHeaderRefresh,
      onFooterRefresh
    } = this.props
    switch (refreshState) {
      case RefreshState.Idle:
        footer = <View style={this.styles.footerContainer} />
        break
      case RefreshState.Failure:
        footer = (
          <TouchableOpacity
            onPress={() => {
              if (data.list.length === 0) {
                if (onHeaderRefresh) {
                  onHeaderRefresh(RefreshState.HeaderRefreshing)
                }
              } else if (onFooterRefresh) {
                onFooterRefresh(RefreshState.FooterRefreshing)
              }
            }}
          >
            {footerFailureComponent || (
              <View style={this.styles.footerContainer}>
                <Text style={this.styles.footerText}>{footerFailureText}</Text>
              </View>
            )}
          </TouchableOpacity>
        )
        break
      case RefreshState.EmptyData:
        footer = (
          <TouchableOpacity
            onPress={() => {
              if (onHeaderRefresh) {
                onHeaderRefresh(RefreshState.HeaderRefreshing)
              }
            }}
          >
            {footerEmptyDataComponent || (
              <Flex
                style={this.styles.footerEmpty}
                direction='column'
                justify='center'
              >
                <Mesume />
                <Text style={[this.styles.footerText, _.mt.sm]}>
                  {footerEmptyDataText}
                </Text>
              </Flex>
            )}
          </TouchableOpacity>
        )
        break
      case RefreshState.FooterRefreshing:
        footer = footerRefreshingComponent || (
          <Flex
            style={[this.styles.footerNoMore, _.container.wind]}
            justify='center'
            direction='column'
          >
            <ActivityIndicator size='small' />
            <Text style={_.mt.sm} type='sub' align='center'>
              {footerRefreshingText}
            </Text>
          </Flex>
        )
        break
      case RefreshState.NoMoreData:
        footer = footerNoMoreDataComponent || (
          <Flex
            style={[this.styles.footerNoMore, _.container.wind]}
            justify='center'
            direction='column'
          >
            <Mesume size={80} />
            {systemStore.setting.speech && (
              <Text style={_.mt.sm} type='sub' align='center'>
                {randomSpeech()}
              </Text>
            )}
          </Flex>
        )
        break
      default:
        break
    }
    return footer
  }

  renderRefreshControl() {
    const { data, progressViewOffset, refreshControlProps } = this.props
    const { refreshState } = this.state
    return (
      <RefreshControl
        title={
          data._loaded
            ? `上次刷新时间: ${simpleTime(date(data._loaded))}`
            : undefined
        }
        titleColor={_.colorSub}
        progressViewOffset={progressViewOffset}
        refreshing={refreshState === RefreshState.HeaderRefreshing}
        onRefresh={this.onHeaderRefresh}
        {...refreshControlProps}
      />
    )
  }

  render() {
    const {
      style,
      data,
      sectionKey,
      sections,
      progressViewOffset,
      refreshControlProps,
      optimize,
      ...other
    } = this.props
    if (sectionKey || sections) {
      return (
        <SectionList sections={this.section} {...this.commonProps} {...other} />
      )
    }
    return <FlatList data={this.data} {...this.commonProps} {...other} />
  }

  get styles() {
    return memoStyles()
  }
}

const memoStyles = _.memoStyles(_ => ({
  container: {
    minHeight: _.window.height * 0.24
  },
  footerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    height: 40
  },
  footerText: {
    fontSize: 14 + _.fontSizeAdjust,
    color: _.colorSub
  },
  footerEmpty: {
    minHeight: 240
  },
  footerNoMore: {
    padding: 8
  }
}))
