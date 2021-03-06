import { Component, Element, Event, EventEmitter, Listen, Method, Prop } from '@stencil/core';
import { Animation, AnimationBuilder, Config, FrameworkDelegate } from '../../index';

import { createThemedClasses, getClassMap } from '../../utils/theme';
import { BACKDROP, OverlayEventDetail, OverlayInterface, attachComponent, dismiss, eventMethod, present } from '../../utils/overlays';

import iosEnterAnimation from './animations/ios.enter';
import iosLeaveAnimation from './animations/ios.leave';

import mdEnterAnimation from './animations/md.enter';
import mdLeaveAnimation from './animations/md.leave';

@Component({
  tag: 'ion-popover',
  styleUrls: {
    ios: 'popover.ios.scss',
    md: 'popover.md.scss'
  },
  host: {
    theme: 'popover'
  }
})
export class Popover implements OverlayInterface {

  private usersElement: HTMLElement;

  presented = false;
  animation: Animation;

  @Element() el: HTMLElement;

  @Prop({ connect: 'ion-animation-controller' }) animationCtrl: HTMLIonAnimationControllerElement;
  @Prop({ context: 'config' }) config: Config;
  @Prop() delegate: FrameworkDelegate;
  @Prop() overlayId: number;

  /**
   * The color to use from your Sass `$colors` map.
   * Default options are: `"primary"`, `"secondary"`, `"tertiary"`, `"success"`, `"warning"`, `"danger"`, `"light"`, `"medium"`, and `"dark"`.
   * For more information, see [Theming your App](/docs/theming/theming-your-app).
   */
  @Prop() color: string;

  /**
   * The mode determines which platform styles to use.
   * Possible values are: `"ios"` or `"md"`.
   * For more information, see [Platform Styles](/docs/theming/platform-specific-styles).
   */
  @Prop() mode: 'ios' | 'md';

  /**
   * Animation to use when the popover is presented.
   */
  @Prop() enterAnimation: AnimationBuilder;

  /**
   * Animation to use when the popover is dismissed.
   */
  @Prop() leaveAnimation: AnimationBuilder;

  /**
   * The component to display inside of the popover.
   */
  @Prop() component: string;

  /**
   * The data to pass to the popover component.
   */
  @Prop() data: any = {};

  /**
   * Additional classes to apply for custom CSS. If multiple classes are
   * provided they should be separated by spaces.
   */
  @Prop() cssClass: string;

  /**
   * If true, the popover will be dismissed when the backdrop is clicked. Defaults to `true`.
   */
  @Prop() enableBackdropDismiss = true;

  /**
   * The event to pass to the popover animation.
   */
  @Prop() ev: any;

  /**
   * If true, a backdrop will be displayed behind the popover. Defaults to `true`.
   */
  @Prop() showBackdrop = true;

  /**
   * If true, the popover will be translucent. Defaults to `false`.
   */
  @Prop() translucent = false;

  /**
   * If true, the popover will animate. Defaults to `true`.
   */
  @Prop() willAnimate = true;

  /**
   * Emitted after the popover has loaded.
   */
  @Event() ionPopoverDidLoad: EventEmitter<void>;

  /**
   * Emitted after the popover has unloaded.
   */
  @Event() ionPopoverDidUnload: EventEmitter<void>;

  /**
   * Emitted after the popover has presented.
   */
  @Event({eventName: 'ionPopoverDidPresent'}) didPresent: EventEmitter<void>;

  /**
   * Emitted before the popover has presented.
   */
  @Event({eventName: 'ionPopoverWillPresent'}) willPresent: EventEmitter<void>;

  /**
   * Emitted before the popover has dismissed.
   */
  @Event({eventName: 'ionPopoverWillDismiss'}) willDismiss: EventEmitter<OverlayEventDetail>;

  /**
   * Emitted after the popover has dismissed.
   */
  @Event({eventName: 'ionPopoverDidDismiss'}) didDismiss: EventEmitter<OverlayEventDetail>;


  componentDidLoad() {
    this.ionPopoverDidLoad.emit();
  }

  componentDidUnload() {
    this.ionPopoverDidUnload.emit();
  }

  @Listen('ionDismiss')
  protected onDismiss(ev: UIEvent) {
    ev.stopPropagation();
    ev.preventDefault();

    this.dismiss();
  }

  @Listen('ionBackdropTap')
  protected onBackdropTap() {
    this.dismiss(null, BACKDROP);
  }

  @Listen('ionPopoverDidPresent')
  @Listen('ionPopoverWillPresent')
  @Listen('ionPopoverWillDismiss')
  @Listen('ionPopoverDidDismiss')
  protected lifecycle(modalEvent: CustomEvent) {
    const el = this.usersElement;
    const name = LIFECYCLE_MAP[modalEvent.type];
    if (el && name) {
      const event = new CustomEvent(name, {
        bubbles: false,
        cancelable: false,
        detail: modalEvent.detail
      });
      el.dispatchEvent(event);
    }
  }

  /**
   * Present the popover overlay after it has been created.
   */
  @Method()
  present(): Promise<void> {
    if (this.presented) {
      return Promise.reject('df');
    }
    const container = this.el.querySelector('.popover-content');
    const data = {
      ...this.data,
      popover: this.el
    };
    const classes = {
      ...getClassMap(this.cssClass),
      'popover-viewport': true
    };
    return attachComponent(this.delegate, container, this.component, classes, data)
      .then(el => this.usersElement = el)
      .then(() => present(this, 'popoverEnter', iosEnterAnimation, mdEnterAnimation, this.ev));
  }

  /**
   * Dismiss the popover overlay after it has been presented.
   */
  @Method()
  dismiss(data?: any, role?: string): Promise<void> {
    return dismiss(this, data, role, 'popoverLeave', iosLeaveAnimation, mdLeaveAnimation, this.ev);
  }

  /**
   * Returns a promise that resolves when the popover did dismiss. It also accepts a callback
   * that is called in the same circustances.
   *
   * ```
   * const {data, role} = await popover.onDidDismiss();
   * ```
   */
  @Method()
  onDidDismiss(callback?: (detail: OverlayEventDetail) => void): Promise<OverlayEventDetail> {
    return eventMethod(this.el, 'ionPopoverDidDismiss', callback);
  }

  /**
   * Returns a promise that resolves when the popover will dismiss. It also accepts a callback
   * that is called in the same circustances.
   *
   * ```
   * const {data, role} = await popover.onWillDismiss();
   * ```
   */
  @Method()
  onWillDismiss(callback?: (detail: OverlayEventDetail) => void): Promise<OverlayEventDetail> {
    return eventMethod(this.el, 'ionPopoverWillDismiss', callback);
  }

  hostData() {
    const themedClasses = this.translucent ? createThemedClasses(this.mode, this.color, 'popover-translucent') : {};

    return {
      style: {
        zIndex: 10000 + this.overlayId,
      },
      'no-router': true,
      class: {
        ...themedClasses
      }
    };
  }

  render() {
    const wrapperClasses = createThemedClasses(this.mode, this.color, 'popover-wrapper');

    return [
      <ion-backdrop tappable={this.enableBackdropDismiss}/>,
      <div class={wrapperClasses}>
        <div class='popover-arrow'></div>
        <div class='popover-content'></div>
      </div>
    ];
  }
}

export interface PopoverOptions {
  component: any;
  data?: any;
  showBackdrop?: boolean;
  enableBackdropDismiss?: boolean;
  translucent?: boolean;
  enterAnimation?: AnimationBuilder;
  leaveAnimation?: AnimationBuilder;
  cssClass?: string;
  ev: Event;
  delegate?: FrameworkDelegate;
}

const LIFECYCLE_MAP: any = {
  'ionPopoverDidPresent': 'ionViewDidEnter',
  'ionPopoverWillPresent': 'ionViewWillEnter',
  'ionPopoverWillDismiss': 'ionViewWillDismiss',
  'ionPopoverDidDismiss': 'ionViewDidDismiss',
};


export const POPOVER_POSITION_PROPERTIES: any = {
  ios: {
    padding: 2,
    unit: '%',
    showArrow: true,
    centerTarget: true
  },
  md: {
    padding: 12,
    unit: 'px',
    showArrow: false,
    centerTarget: false
  }
};
