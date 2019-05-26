/*
 * @Author: czy0729
 * @Date: 2019-05-19 17:10:16
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-05-21 05:23:43
 */
import React from 'react'
import { Image } from '@components'
import _ from '@styles'

const Avatar = ({ style, navigation, userId, src, size }) => (
  <Image
    style={style}
    size={size}
    src={src}
    radius
    border={_.colorBorder}
    quality={false}
    onPress={
      navigation
        ? () => {
            navigation.push('Zone', {
              userId
            })
          }
        : undefined
    }
  />
)

Avatar.defaultProps = {
  size: 28
}

export default Avatar