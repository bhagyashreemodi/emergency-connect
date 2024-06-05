class HomePage {
  constructor(publicWall, esnDirectory, privateChatManager, announcement, incidentMap, shelter, resourceSharingHub) {
    this.publicWall = publicWall;
    this.esnDirectory = esnDirectory;
    this.privateChatManager = privateChatManager;
    this.announcement = announcement;
    this.incidentMap = incidentMap;
    this.shelter = shelter;
    this.resourceSharingHub = resourceSharingHub;
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.totalResults = 0;
    this.searchResults = [];
    this.initEventHandlers();
  }

  static getCurrentActiveTabName() {
    const hash = window.location.hash;
    return hash ? hash.substring(1) : 'esn-directory';
  }

  initEventHandlers() {
    $(document).ready(async () => {
      document.getElementById('usernameDisplay').textContent = `Hello, ${localStorage.getItem('username')}!`;
      this.handleSpeedTestButtonDisplay();
      $('a[data-toggle="tab"]').on('click', async (e) => {
        e.preventDefault();
        const anchor = $(e.target).closest('a');
        const target = anchor.attr("href");
        const tabName = target.substring(1);
        await this.loadTabContent(tabName);
      });

      let tabName = HomePage.getCurrentActiveTabName();
      tabName = (tabName === 'private-chat') ? 'esn-directory' : tabName;
      console.log(`Initial tab: ${tabName}`);
      await this.loadTabContent(tabName);

      $('#logoutButton').on('click', () => {
        this.logoutUser();
      });

      if (!this.isUserLoggedIn()) {
        window.location.href = '/auth';
        console.log("User not logged in");
        return;
      }

    });
  }

  isUserLoggedIn() {
    return !!localStorage.getItem('username');
  }

  isPublicWallTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'public-wall';
  }

  isPrivateMessageTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'private-chat';
  }

  isESNDirectoryTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'esn-directory';
  }

  isDmsTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'dms';
  }

  isAnnouncementTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'announcement';
  }

  isShelterTabOpen() {
    console.log(HomePage.getCurrentActiveTabName());
    return HomePage.getCurrentActiveTabName() === 'shelter';
  }

  isPostChatTabOpen() {
    console.log(HomePage.getCurrentActiveTabName());
    return HomePage.getCurrentActiveTabName() === 'post-chat';
  }

  isResourceSharingTabOpen() {
    return HomePage.getCurrentActiveTabName() === 'resource-sharing-hub';
  }

  async loadTabContent(tabName) {
    window.location.hash = tabName;
    this.setActiveTab(tabName);
    let url = `/${tabName}`;
    try {
      console.log(`[loadTabContent] Try loading tab content: ${url}`);
      const response = await axios.get(url);
      $('#tab-content').html(response.data);
      await this.loadTab(tabName, url);
      // Reattach search modal event handlers
      $('#searchButton').off('click').on('click', () => {
        this.openSearchModal();
      });
    } catch (error) {
      console.error("Failed to load tab content.", error);
    }
  }

  async loadTab(tabName, url) {
    if (tabName === 'esn-directory') {
      await this.esnDirectory.reinitEventHandlers();
      await this.esnDirectory.fetchDirectory();
    } else if (tabName === 'public-wall') {
      await this.publicWall.fetchMessages();
    } else if (tabName === 'dms') {
      await this.esnDirectory.loadDms();
    } else if (tabName === 'private-chat') {
      await this.privateChatManager.loadContents();
    } else if (tabName == 'announcement') {
      await this.announcement.retrieveAnnouncement();
    } else if (tabName == 'resources') {
      this.loadResourcesTab();
    } else if (tabName == 'incident-map') {
      this.loadIncidentsMap();
    } else if (tabName == 'volunteer-management') {
      console.log("Loading volunteer management page...");
      volunteerManagement.initializeEventListeners();
    } else if (tabName === 'resource-sharing-hub') {
      await this.resourceSharingHub.loadContents();
    } else if (tabName == 'shelter') {
      await this.shelter.retrieveShelterPosts();
    } else if (tabName == 'post-chat') {
      await this.shelter.loadPostChatContents();
    } else {
      console.error(`Unknown url: ${url}`);
    }
  }

  loadIncidentsMap() {
    $('#closeResourceManagerBtn').off('click').on('click', () => {
      console.log("Closing resource manager");
      this.onCloseResourceManager('resources');
    });
    $(document).trigger('incident-map-loaded');
  }

  loadResourcesTab() {
    $('.resource-item').off('click').on('click', async (e) => {
      const resourceItem = $(e.currentTarget).data('resource');
      await this.onResourceItemClicked(resourceItem);
    });
  }

  setActiveTab(tabName) {
    $('a[data-toggle="tab"]').removeClass('active');

    const validTabsInTopBar = new Set([
      'esn-directory', 'public-wall', 'dms', 'announcement', 'resources'
    ]);
    if (!validTabsInTopBar.has(tabName))
      return;

    const tabElement = `#${tabName}-tab`;
    $(tabElement).addClass('active');
    const target = $(tabElement).attr("href");
    // $('.tab-pane').removeClass('show active');
    $(target).addClass('show active');
  }

  deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  }

  async logoutUser() {
    try {
      console.log("Logging out user");
      $(window).off('beforeunload');
      const username = localStorage.getItem('username');
      if (!username) throw new Error('Username not found in local storage.');
      const apiUrl = `/users/${encodeURIComponent(username)}/offline`;
      await axios.put(apiUrl);

      localStorage.removeItem('username');
      localStorage.removeItem('privilege');
      this.deleteCookie('token');
      window.location.href = '/auth';
      $('#accountInactiveModal').modal('show');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  openSearchModal() {
    console.log("Opening search modal");
    this.resetSearchModal();

    $('#searchModal').modal('show');

    $('input[name="searchType"]').on('change', () => {
      this.updateSearchInputVisibility();
    });

    $('#searchExecuteBtn').on('click', () => {
      this.executeSearch();
    });

    $('#searchModal').on('hidden.bs.modal', () => {
      this.resetSearchModal();
    });

    $('#clearSearchBtn').on('click', () => {
      this.resetSearchInput();
    });

    this.updateSearchTypeToggleVisibility();
  }

  resetSearchModal() {
    $('#searchResults').empty().hide();
    $('#searchInput').val('');
    $('#searchStatusSelect').val('');
    this.currentPage = 1;
    this.totalPages = 1;
    $('#noSearchText').show();
    $('#prevPageBtn').prop('disabled', true);
    $('#nextPageBtn').prop('disabled', true);
    $('#resultCount').hide();
  }

  updateSearchInputVisibility() {
    const searchType = $('input[name="searchType"]:checked').val();
    $('#searchInput').val('');
    $('#searchStatusSelect').val('');
    if (searchType === 'username') {
      $('#searchInput').show();
      $('#searchStatusSelect').hide();
    } else if (searchType === 'status') {
      $('#searchInput').hide();
      $('#searchStatusSelect').show();
    }
  }

  updateSearchTypeToggleVisibility() {
    if (this.isESNDirectoryTabOpen()) {
      $('#searchTypeToggle').show();
    } else {
      $('#searchTypeToggle').hide();
      $('#searchInput').show();
      $('#searchStatusSelect').hide();
    }
  }

  resetSearchInput() {
    $('#searchInput').val('');
    $('#searchStatusSelect').val('');
    this.currentPage = 1;
  }

  async executeSearch() {
    const searchType = $('input[name="searchType"]:checked').val();
    const searchKeyword = searchType === 'username' ? $('#searchInput').val() : $('#searchStatusSelect').val();
    const searchParams = this.buildSearchParams(searchType, searchKeyword);

    try {
        const response = await axios.get('/entities', { params: searchParams });
        this.processSearchResults(response.data);
        this.updateSearchResultsDisplay();
    } catch (error) {
        console.error('Search failed:', error);
        // Handle error, show error message to the user
    }
  }

  buildSearchParams(searchType, searchKeyword) {
      const params = {
          context: this.getSearchContext(),
          keyword: searchKeyword,
      };

      if (this.getSearchContext() !== 'user') {
          params.offset = (this.currentPage - 1) * this.pageSize;
          params.limit = this.pageSize;
      }

      if (searchType === 'status') {
          params.status = searchKeyword;
      }

      if (this.isPrivateMessageTabOpen()) {
          params.user1 = localStorage.getItem('username');
          params.user2 = this.privateChatManager.chatTarget || '';
      }

      return params;
  }

  processSearchResults(data) {
      this.searchResults = data.results;
      this.totalResults = data.totalResults;
      this.totalPages = Math.ceil(data.totalResults / this.pageSize);
      console.log(`Search results: ${this.searchResults.length} items`);
  }

  getSearchContext() {
    if (this.isESNDirectoryTabOpen()) {
      return 'user';
    } else if (this.isAnnouncementTabOpen()) {
      return 'announcement';
    } else if (this.isPublicWallTabOpen()) {
      return 'public-message';
    } else if (this.isPrivateMessageTabOpen()) {
      return 'private-message';
    }
    return '';
  }

  showSearchResults() {
    $('#noSearchText').hide();
    $('#resultCount').show();
    $('#searchResults').scrollTop(0);

    if (this.isESNDirectoryTabOpen()) {
      $('#prevPageBtn').prop('disabled', true);
      $('#nextPageBtn').prop('disabled', true);
    } else {
      $('#prevPageBtn').prop('disabled', false);
      $('#nextPageBtn').prop('disabled', false);
    }

    this.updateResultCount();
  }

  showNoResultsMessage() {
    $('#noSearchText').show();
    $('#prevPageBtn').prop('disabled', true);
    $('#nextPageBtn').prop('disabled', true);
    $('#resultCount').hide();
  }

  updateResultCount() {
    if (this.searchResults.length === 0) {
      $('#resultCount').hide();
      return;
    }

    let resultCountText = '';
    if (this.isESNDirectoryTabOpen()) {
      resultCountText = `1-${this.searchResults.length} of ${this.searchResults.length}`;
    } else {
      const startIndex = (this.currentPage - 1) * this.pageSize + 1;
      const endIndex = Math.min(startIndex + this.pageSize - 1, this.totalResults);
      resultCountText = `${startIndex}-${endIndex} of ${this.totalResults}`;
    }

    $('#resultCount').text(resultCountText).show();
  }

  updateSearchResultsDisplay() {
    if (this.searchResults.length > 0) {
      this.showSearchResults();
    } else {
      this.showNoResultsMessage();
    }
    this.displaySearchResults();
  }

  displaySearchResults() {
    if (this.isESNDirectoryTabOpen()) {
        this.displayESNDirectorySearchResults();
    } else {
        this.displayOtherSearchResults();
    }
  }
  
  displayESNDirectorySearchResults() {
      const searchResultsHtml = this.renderESNDirectorySearchResults(this.searchResults);
      $('#searchResults').html(searchResultsHtml).show();
  }
  
  displayOtherSearchResults() {
      this.totalPages = Math.ceil(this.totalResults / this.pageSize);
   
      if (this.searchResults.length > 0) {
          const paginatedResults = this.searchResults;
          const searchResultsHtml = this.renderOtherSearchResults(paginatedResults);
          $('#searchResults').html(searchResultsHtml).show();
          this.updatePaginationButtonsState();
          this.attachPaginationButtonsEvents();
      } else {
          this.showNoResultsMessage();
      }
  }

  renderOtherSearchResults(paginatedResults) {
      if (this.isPublicWallTabOpen()) {
          return this.renderPublicWallSearchResults(paginatedResults);
      } else if (this.isPrivateMessageTabOpen()) {
          return this.renderPrivateMessageSearchResults(paginatedResults);
      } else if (this.isAnnouncementTabOpen()) {
          return this.renderAnnouncementSearchResults(paginatedResults);
      }
  }

  renderESNDirectorySearchResults(results) {
    console.log(results);
    return results.map(user => `
        <div class="directory-item">
          <div class="directory-item-header">
            <span class="directory-username">${user.username}</span>
            <div class="directory-item-widget">
              <span class="mr-2 directory-status ${this.esnDirectory.getStatusClass(user.status)}">${user.status}</span>
              <span class="directory-status directory-status-${user.isOnline ? 'online' : 'offline'}">${user.isOnline ? 'online' : 'offline'}</span>
              </div>
            </div>
        </div>
      `).join('');
  }

  renderPublicWallSearchResults(results) {
    return results.map(message => Utils.renderMessage(message, Utils.getStatusClass(message.status))).join('');
  }

  renderPrivateMessageSearchResults(results) {
    if (this.getSearchContext() === 'private-message' && $('#searchInput').val().toLowerCase() === 'status') {
      // Render only the name and status when the keyword is "status"
      return results.map(message => Utils.renderMessage(message, Utils.getStatusClass(message.status), true)).join('');
    } else {
      // Render the regular search results with message and time
      return results.map(message => Utils.renderMessage(message, Utils.getStatusClass(message.status))).join('');
    }
  }

  renderAnnouncementSearchResults(results) {
    return results.map(announcement => Utils.renderMessage(announcement)).join('');
  }


  updatePaginationButtonsState() {
      if (this.isESNDirectoryTabOpen()) {
        $('#prevPageBtn').prop('disabled', true);
        $('#nextPageBtn').prop('disabled', true);
      } else {
        $('#prevPageBtn').prop('disabled', this.currentPage === 1);
        $('#nextPageBtn').prop('disabled', this.currentPage === this.totalPages);
      }
  }

  attachPaginationButtonsEvents() {
      $('#prevPageBtn').off('click').on('click', this.onPrevPageButtonClick.bind(this));
      $('#nextPageBtn').off('click').on('click', this.onNextPageButtonClick.bind(this));
  }

  async onPrevPageButtonClick() {
      if (this.currentPage > 1) {
          this.currentPage--;
          await this.executeSearch();
          $('#searchResults').scrollTop(0);
      }
  }

  async onNextPageButtonClick() {
      if (this.currentPage < this.totalPages) {
          this.currentPage++;
          await this.executeSearch();
          $('#searchResults').scrollTop(0);
      }
  }

  async onResourceItemClicked(resourceItem) {
    // load tabs of resource
    await this.loadTabContent(resourceItem);
  }

  async onCloseResourceManager(tabNameToGoBack) {
    console.log(`Closing resource manager and going back to ${tabNameToGoBack}`);
    if (!homePage) {
      console.error(`[onCloseResourceManager] homePage not initialized`);
      return;
    }
    await this.loadTabContent('resources');
  }

  handleSpeedTestButtonDisplay() {
    const privilege = localStorage.getItem('privilege');
    if (privilege === 'Administrator') {
      $('#startSpeedTestButton').show();
    } else {
      $('#startSpeedTestButton').hide();
    }
  }
}

const homePage = new HomePage(publicWall, esnDirectory, privateChatManager, announcement, incidentMap, shelter, resourceSharingHub);
