/*
 * @Author: czy0729
 * @Date: 2019-04-14 20:26:45
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-01-18 20:23:49
 */
import React from 'react'
import { StyleSheet } from 'react-native'
import { Flex, Iconfont } from '@components'
import { Popover } from '@screens/_'
import { observer } from '@utils/decorators'

const data = ['列表布局', '方格布局']

function TabBarRight({ $ }) {
  return (
    <Popover data={data} onSelect={$.selectLayout}>
      <Flex style={styles.icon} justify='center'>
        <Iconfont name='extra' size={18} />
      </Flex>
    </Popover>
  )
}

export default observer(TabBarRight)

const styles = StyleSheet.create({
  icon: {
    width: 42,
    height: 42
  }
})
