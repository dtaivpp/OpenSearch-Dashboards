/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import expect from '@osd/expect';

export default function ({ getService, getPageObjects }) {
  const log = getService('log');
  const retry = getService('retry');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const filterBar = getService('filterBar');
  const PageObjects = getPageObjects(['common', 'discover', 'timePicker']);
  const defaultSettings = {
    defaultIndex: 'logstash-*',
    'discover:v2': false,
  };

  describe('discover filter editor', function describeIndexTests() {
    before(async function () {
      log.debug('load opensearch-dashboards index with default index pattern');
      await opensearchArchiver.loadIfNeeded('discover');

      // and load a set of makelogs data
      await opensearchArchiver.loadIfNeeded('logstash_functional');
      await opensearchDashboardsServer.uiSettings.replace(defaultSettings);
      log.debug('discover filter editor');
      await PageObjects.common.navigateToApp('discover');
      await PageObjects.timePicker.setDefaultAbsoluteRange();
    });

    describe('filter editor', function () {
      it('should add a phrases filter', async function () {
        await filterBar.addFilter('extension.raw', 'is one of', 'jpg');
        expect(await filterBar.hasFilter('extension.raw', 'jpg')).to.be(true);
      });

      it('should show the phrases if you re-open a phrases filter', async function () {
        await filterBar.clickEditFilter('extension.raw', 'jpg');
        const phrases = await filterBar.getFilterEditorSelectedPhrases();
        expect(phrases.length).to.be(1);
        expect(phrases[0]).to.be('jpg');
        await filterBar.ensureFieldEditorModalIsClosed();
      });

      it('should support filtering on nested fields', async () => {
        await filterBar.addFilter('nestedField.child', 'is', 'nestedValue');
        expect(await filterBar.hasFilter('nestedField.child', 'nestedValue')).to.be(true);
        await retry.try(async function () {
          expect(await PageObjects.discover.getHitCount()).to.be('1');
        });
      });
    });
  });
}
