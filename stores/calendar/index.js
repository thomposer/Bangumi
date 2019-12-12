/*
 * 时间表, 首页信息聚合
 * @Author: czy0729
 * @Date: 2019-04-20 11:41:35
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-12-13 00:51:58
 */
import { observable, computed } from 'mobx'
import { getTimestamp } from '@utils'
import { fetchHTML, xhrCustom } from '@utils/fetch'
import { HTMLTrim, HTMLToTree, findTreeNode } from '@utils/html'
import store from '@utils/store'
import { HOST, LIST_EMPTY, GITHUB_BANGUMI_ONAIR_URL } from '@constants'
import { API_CALENDAR } from '@constants/api'
import { NAMESPACE, INIT_HOME } from './init'
import { cheerioToday } from './common'

class Calendar extends store {
  state = observable({
    /**
     * 每日放送
     */
    calendar: LIST_EMPTY,

    /**
     * 首页信息聚合
     */
    home: INIT_HOME,

    /**
     * ekibun的线上爬虫数据
     */
    onAir: {
      // [subjectId]: INIT_ONAIR_ITEM
    }
  })

  init = () =>
    this.readStorageThenSetState(
      {
        calendar: LIST_EMPTY,
        home: INIT_HOME,
        onAir: {}
      },
      NAMESPACE
    )

  // -------------------- get --------------------
  @computed get calendar() {
    return this.state.calendar
  }

  @computed get home() {
    return this.state.home
  }

  @computed get onAir() {
    return this.state.onAir
  }

  // -------------------- fetch --------------------
  /**
   * 每日放送
   */
  fetchCalendar = () =>
    this.fetch(
      {
        url: API_CALENDAR(),
        info: '每日放送'
      },
      'calendar',
      {
        list: true,
        storage: true,
        namespace: NAMESPACE
      }
    )

  /**
   * 首页信息聚合
   */
  fetchHome = async () => {
    // -------------------- 请求HTML --------------------
    const res = fetchHTML({
      url: `!${HOST}`
    })
    const raw = await res
    const HTML = HTMLTrim(raw)

    const data = {
      anime: [],
      game: [],
      book: [],
      music: [],
      real: [],
      today: '今日上映 - 部。共 - 人收看今日番组。'
    }
    const itemsHTML = HTML.match(
      /<ul id="featuredItems" class="featuredItems">(.+?)<\/ul>/
    )
    if (itemsHTML) {
      const type = ['anime', 'game', 'book', 'music', 'real']

      let node
      const tree = HTMLToTree(itemsHTML[1])
      tree.children.forEach((item, index) => {
        const list = []

        item.children.forEach(({ children }, idx) => {
          // 第一个是标签栏, 排除掉
          if (idx === 0) {
            return
          }

          node =
            findTreeNode(children, 'a > div|style~background') ||
            findTreeNode(children, 'a|style~background')
          const cover = node
            ? node[0].attrs.style.replace(
                /background:#000 url\(|\) 50%|background-image:url\('|'\);/g,
                ''
              )
            : ''

          node = findTreeNode(children, 'a|href&title')
          const title = node ? node[0].attrs.title : ''
          const subjectId = node
            ? node[0].attrs.href.replace('/subject/', '')
            : ''

          node =
            findTreeNode(children, 'p > small') ||
            findTreeNode(children, 'div > small')
          const info = node ? node[0].text[0] : ''

          list.push({
            cover,
            title,
            subjectId,
            info
          })
        })

        data[type[index]] = list
      })
    }

    const todayHTML = HTML.match('<li class="tip">(.+?)</li>')
    if (todayHTML) {
      data.today = cheerioToday(`<li>${todayHTML[1]}</li>`)
    }

    const key = 'home'
    this.setState({
      [key]: {
        ...data,
        _loaded: getTimestamp()
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return res
  }

  /**
   * onAir数据
   */
  fetchOnAir = async () => {
    try {
      const { _response } = await xhrCustom({
        url: GITHUB_BANGUMI_ONAIR_URL
      })
      const data = {
        _loaded: true
      }
      JSON.parse(_response).forEach(item => {
        const airEps = item.eps.filter(item => item.status === 'Air')
        if (!item.weekDayCN || !item.timeCN) {
          return
        }

        data[item.id] = {
          timeCN: item.timeCN,
          weekDayCN: item.weekDayCN
        }
        if (airEps.length) {
          data[item.id].air = airEps[airEps.length - 1].sort
        }
      })

      const key = 'onAir'
      this.clearState(key, data)
      this.setStorage(key, undefined, NAMESPACE)
    } catch (error) {
      console.warn('[CalendarStore] fetchOnAir', error)
    }
  }
}

export default new Calendar()
