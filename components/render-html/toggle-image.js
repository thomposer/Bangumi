/*
 * @Author: czy0729
 * @Date: 2019-08-14 10:15:24
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-02-23 05:22:55
 */
import React from 'react'
import { StyleSheet } from 'react-native'
import { observer } from 'mobx-react'
import { ActivityIndicator } from '@ant-design/react-native'
import { HOST } from '@constants'
import { _ } from '@stores'
import Flex from '../flex'
import Image from '../image'
import Touchable from '../touchable'
import Iconfont from '../iconfont'
import Text from '../text'

export default
@observer
class ToggleImage extends React.Component {
  static defaultProps = {
    onImageFallback: Function.prototype
  }

  state = {
    show: this.props.show || false,
    loaded: false
  }

  toggleShow = () => {
    const { show } = this.state
    this.setState({
      show: !show
    })
  }

  onLoadEnd = () =>
    this.setState({
      loaded: true
    })

  render() {
    // RN不使用第三方link包暂时不支持webp, 暂时使用浏览器跳转
    const { src, onImageFallback } = this.props
    if (typeof src === 'string' && src.includes('.webp')) {
      return (
        <Touchable onPress={onImageFallback}>
          <Flex style={this.styles.imagePlaceholder} justify='center'>
            <Text size={13} type='sub'>
              暂不支持webp图片, 使用浏览器打开
            </Text>
          </Flex>
        </Touchable>
      )
    }

    const { show, loaded } = this.state
    if (!show) {
      return (
        <Touchable onPress={this.toggleShow}>
          <Flex style={this.styles.imagePlaceholder} justify='center'>
            <Text size={13} type='sub'>
              点击显示图片
            </Text>
          </Flex>
        </Touchable>
      )
    }

    return (
      <Flex justify='center'>
        <Image
          {...this.props}
          headers={{
            Referer: HOST
          }}
          onLoadEnd={this.onLoadEnd}
          onError={this.onLoadEnd}
        />
        {!this.props.show && (
          <Touchable
            style={this.styles.closeImageWrap}
            onPress={this.toggleShow}
          >
            <Flex style={this.styles.closeImage} justify='center'>
              <Iconfont size={13} name='close' color={_.__colorPlain__} />
            </Flex>
          </Touchable>
        )}
        {!loaded && (
          <Flex
            style={[
              StyleSheet.absoluteFill,
              {
                width: this.props.autoSize
              }
            ]}
            justify='center'
          >
            <ActivityIndicator size='small' color={_.colorIcon} />
          </Flex>
        )}
      </Flex>
    )
  }

  get styles() {
    return memoStyles()
  }
}

const memoStyles = _.memoStyles(_ => ({
  loading: {
    width: 32,
    height: 32
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: _.colorBorder
  },
  closeImageWrap: {
    position: 'absolute',
    zIndex: 1,
    top: _.sm,
    right: _.sm
  },
  closeImage: {
    width: 32,
    height: 32,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden'
  }
}))
