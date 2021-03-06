/*
 * @Author: czy0729
 * @Date: 2019-04-29 19:28:43
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-02-18 02:36:56
 */
import React from 'react'
import { StyleSheet, Alert, View } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { ListView, FixedTextarea } from '@components'
import { _ } from '@stores'
import { copy, open } from '@utils'
import { inject, withTransitionHeader } from '@utils/decorators'
import { keyExtractor } from '@utils/app'
import { hm, t } from '@utils/fetch'
import { info } from '@utils/ui'
import { HOST } from '@constants'
import Top from './top'
import Item from './item'
import TouchScroll from './touch-scroll'
import IconFavor from './icon-favor'
import Store from './store'

const title = '帖子'
const ListHeaderComponent = <Top />

export default
@inject(Store)
@withTransitionHeader({
  screen: title,
  barStyle: 'dark-content'
})
@observer
class Topic extends React.Component {
  static contextTypes = {
    $: PropTypes.object,
    navigation: PropTypes.object
  }

  listView
  fixedTextarea
  scrollFailCount = 0

  async componentDidMount() {
    const { $, navigation } = this.context
    if (!$.isUGCAgree) {
      /**
       * @issue 这里注意在iOS上面, 一定要延迟,
       * 不然首页点击讨论跳进来popover + alert直接就不能操作了
       */
      setTimeout(() => {
        t('帖子.UCG')

        Alert.alert(
          '社区指导原则',
          '生命有限, Bangumi 是一个纯粹的ACG网络, 请查看社区指导原则并且同意才能继续操作',
          [
            {
              text: '取消',
              style: 'cancel',
              onPress: () => navigation.goBack()
            },
            {
              text: '查看',
              onPress: () => {
                navigation.goBack()
                navigation.push('UGCAgree', {
                  topicId: $.topicId
                })
              }
            }
          ]
        )
      }, 800)
      return
    }

    const url =
      navigation.getParam('_url') || `${HOST}/rakuen/topic/${$.topicId}`
    navigation.setParams({
      extra: <IconFavor $={$} />,
      popover: {
        data: ['浏览器查看', '复制链接', '举报'],
        onSelect: key => {
          t('帖子.右上角菜单', {
            key
          })

          switch (key) {
            case '浏览器查看':
              open(url)
              break
            case '复制链接':
              copy(url)
              info('已复制')
              break
            case '举报':
              open(`${HOST}/group/forum`)
              break
            default:
              break
          }
        }
      }
    })

    await $.init()
    const { title } = $.topic
    withTransitionHeader.setTitle(navigation, title)

    if ($.postId) {
      this.jump()
    }

    hm(`rakuen/topic/${$.topicId}`, 'Topic')
  }

  connectListViewRef = ref => (this.listView = ref)

  connectFixedTextareaRef = ref => (this.fixedTextarea = ref)

  jump = () => {
    const { $ } = this.context
    if (!$.postId) {
      return
    }

    const { list, _loaded } = $.comments
    if (_loaded) {
      try {
        let scrollIndex = 0
        list.forEach((item, index) => {
          if (scrollIndex) {
            return
          }

          if (item.id === $.postId) {
            scrollIndex = index
          } else if (item.sub) {
            item.sub.forEach(i => {
              if (i.id === $.postId) {
                scrollIndex = index
              }
            })
          }
        })

        if (scrollIndex) {
          this.scrollTo(scrollIndex)
        }
      } catch (error) {
        warn('topic/index.js', 'jump', error)
      }
    }
  }

  scrollTo = (index = 0) => {
    const { $ } = this.context
    const { list } = $.comments
    info(list[index].floor, 0.8)
    try {
      this.listView.scrollToIndex({
        animated: false,
        index,
        viewOffset: 0
      })
    } catch (error) {
      warn('topic/index.js', 'scrollTo', error)
    }
  }

  scrollToThenFeedback = (index = 0) => {
    const { $ } = this.context
    t('帖子.楼层跳转', {
      topicId: $.topicId,
      index
    })

    if (index === -1) {
      info('#1', 0.8)
      this.listView.scrollToOffset({
        animated: true,
        offset: 0 - _.headerHeight
      })
      return
    }

    const { list } = $.comments
    info(list[index].floor, 0.8)
    try {
      this.listView.scrollToIndex({
        animated: true,
        index,
        viewOffset: 0 + _.headerHeight
      })
    } catch (error) {
      warn('topic/index.js', 'scrollToThenFeedback', error)
    }
  }

  onScrollToIndexFailed = ({ highestMeasuredFrameIndex, index }) => {
    this.scrollTo(highestMeasuredFrameIndex)
    setTimeout(() => {
      if (this.scrollFailCount > 10) {
        return
      }
      this.scrollFailCount += 1
      this.scrollTo(index)
    }, 100)
  }

  showFixedTextare = () => this.fixedTextarea.onFocus()

  renderItem = ({ item, index }) => {
    const { $ } = this.context
    const event = {
      id: '帖子.跳转',
      data: {
        topicId: $.topicId
      }
    }
    return (
      <Item
        index={index}
        postId={$.postId}
        authorId={$.topic.userId}
        {...item}
        showFixedTextare={this.showFixedTextare}
        event={event}
      />
    )
  }

  render() {
    const { $ } = this.context
    const { placeholder, value } = $.state
    const { onScroll } = this.props
    return (
      <View style={_.container.content}>
        <ListView
          ref={this.connectListViewRef}
          style={_.container.content}
          contentContainerStyle={styles.contentContainerStyle}
          keyExtractor={keyExtractor}
          data={$.comments}
          scrollEventThrottle={16}
          initialNumToRender={50}
          removeClippedSubviews={false}
          optimize={false}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={this.renderItem}
          onScroll={onScroll}
          onScrollToIndexFailed={this.onScrollToIndexFailed}
          onHeaderRefresh={$.fetchTopic}
          onFooterRefresh={$.fetchTopic}
          onEndReachedThreshold={0.5}
          {...withTransitionHeader.listViewProps}
        />
        {$.isWebLogin && (
          <FixedTextarea
            ref={this.connectFixedTextareaRef}
            placeholder={placeholder ? `回复 ${placeholder}` : undefined}
            value={value}
            onChange={$.onChange}
            onClose={$.closeFixedTextarea}
            onSubmit={$.doSubmit}
          />
        )}
        <TouchScroll onPress={this.scrollToThenFeedback} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingBottom: _.bottom
  }
})
