import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Based on mature technology',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        <code>maxGraph</code> is the successor of{' '}
        <a href="https://github.com/jgraph/mxgraph">mxGraph</a> (which is now EOL in its
        public version), the diagram library that powers{' '}
        <a href="https://www.drawio.com/">draw.io</a>.
      </>
    ),
  },
  {
    title: 'Fully typed',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        <code>maxGraph</code> is written in TypeScript and provides precise types to guide
        you easily when developing or reading API documentation.
      </>
    ),
  },
  {
    title: 'Flexible with convenient defaults',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        <code>maxGraph</code> is highly configurable and offers numerous extension points.
        But it also provides numerous built-in elements, for example for shapes and
        styles.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
