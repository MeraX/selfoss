/**
 * toolbar of an single entry
 */
selfoss.events.entriesToolbar = function(parent) {
    if (typeof parent == 'undefined') {
        parent = $('#content');
    }

    // prevent close on links
    parent.find('.entry-content a').unbind('click').click(function(e) {
        window.open($(this).attr('href'));
        e.preventDefault();
        return false;
    });

    // load images
    parent.find('.entry-loadimages').unbind('click').click(function() {
        $(this).parents('.entry').lazyLoadImages();
        $(this).fadeOut();
        return false;
    });

    // open in new window and mark as read
    parent.find('.entry-newwindow').unbind('click').click(function(e) {
        var entry = $(this).parents('.entry');
        entry.find('.entry-unread.active').click();
        window.open(entry.children('.entry-datetime').attr('href'));
        e.preventDefault();
        return false;
    });

    // next item on smartphone
    parent.find('.entry-toolbar .entry-next').unbind('click').click(function() {
        selfoss.shortcuts.nextprev('next', true);
        return false;
    });

    // next item on tablet
    parent.find('.entry-smartphone-share .entry-next').unbind('click').click(function() {
        var $selected = $('.entry.selected, .entry.fullscreen:visible');
        var id = $selected.attr('id').replace('entrr', 'entry');
        $selected.find('.entry-unread.active').click();
        $selected.find('.entry-title').click();
        $('#' + id).next('.entry').find('.entry-title').click();
        return false;
    });

    // configure shares
    var shares = selfoss.shares.getAll();
    if (shares.length > 0) {
        if (parent.find('.entry-toolbar').has('button.entry-share' + shares[0]).length == 0) {
            // add the share toolbar entries
            parent.find('.entry-smartphone-share button.entry-newwindow').after(selfoss.shares.buildLinks(shares, function(name) {
                return '<button class="entry-share entry-share' + name + '" title="' + name + '"><img class="entry-share" title="' + name + '" src="images/' + name + '.png" height="16" width="16">' + name + '</button>';
            }));
            parent.find('.entry-toolbar button.entry-next').after(selfoss.shares.buildLinks(shares, function(name) {
                return '<button class="entry-share entry-share' + name + '"><img title="' + name + '" src="images/' + name + '.png" height="16" width="16"></button>';
            }));
            // hookup the share icon click events
            for (var i = 0; i < shares.length; i++) {
                (function(share) {
                    parent.find('.entry-share' + share).unbind('click').click(function(e) {
                        var entry = $(this).parents('.entry');
                        selfoss.shares.share(share, entry.children('.entry-link').eq(0).attr('href'), entry.children('.entry-title').html());
                        e.preventDefault();
                        return false;
                    });
                })(shares[i]);
            }
        }
    }

    // only loggedin users
    if ($('body').hasClass('loggedin') == true) {
        // starr/unstarr
        parent.find('.entry-starr').unbind('click').click(function() {
            var parent = $(this).parents('.entry');
            var id = parent.attr('id').substr(5);
            var starr = $(this).hasClass('active') == false;

            selfoss.ui.entryStarr(id, starr);

            // update statistics in main menue
            var updateStats = function(starr) {
                var starred = parseInt($('.nav-filter-starred span').html());
                if (starr) {
                    starred++;
                } else {
                    starred--;
                }
                $('.nav-filter-starred span').html(starred);
            };
            updateStats(starr);

            $.ajax({
                url: $('base').attr('href') + (starr ? 'starr/' : 'unstarr/') + id,
                data: { ajax: true },
                type: 'POST',
                error: function(jqXHR, textStatus, errorThrown) {
                    // rollback ui changes
                    selfoss.ui.entryStarr(id, !starr);
                    updateStats(!starr);
                    selfoss.ui.showError('Can not star/unstar item: ' +
                                         textStatus + ' ' + errorThrown);
                }
            });

            return false;
        });

        // read/unread
        parent.find('.entry-unread').unbind('click').click(function() {
            var entry = $(this).parents('.entry');
            var id = entry.attr('data-entry-id');
            var unread = $(this).hasClass('active') == true;

            selfoss.ui.entryMark(id, !unread);

            // update statistics in main menue and the currently active tag
            var updateStats = function(unread) {
                // update all unread counter
                var unreadstats = parseInt($('.nav-filter-unread span').html());
                if (unread) {
                    unreadstats--;
                } else {
                    unreadstats++;
                }
                selfoss.refreshUnread(unreadstats);

                if (selfoss.sourceNavLoaded) {
                    // update unread count on sources
                    var sourceId = entry.attr('data-entry-source');
                    var sourceNav = $('#source' + sourceId + ' .unread');
                    var sourceCount = parseInt(sourceNav.html());
                    if (typeof sourceCount != 'number' || isNaN(sourceCount) == true) {
                        sourceCount = 0;
                    }
                    sourceCount = unread ? sourceCount - 1 : sourceCount + 1;
                    if (sourceCount <= 0) {
                        sourceCount = '';
                        $('#source' + sourceId + '').removeClass('unread');
                    } else {
                        $('#source' + sourceId + '').addClass('unread');
                    }
                    sourceNav.html(sourceCount);
                }

                // update unread on tags
                $('#entry' + id + ' .entry-tags-tag').each(function() {
                    var tag = $(this).html();

                    var tagsCountEl = $('#nav-tags > li > span.tag').filter(function() {
                        return $(this).html() == tag;
                    }).next();

                    var unreadstats = 0;
                    if (tagsCountEl.html() != '') {
                        unreadstats = parseInt(tagsCountEl.html());
                    }

                    if (unread) {
                        unreadstats--;
                    } else {
                        unreadstats++;
                    }

                    if (unreadstats > 0) {
                        tagsCountEl.html(unreadstats);
                    } else {
                        tagsCountEl.html('');
                    }

                });
            };
            updateStats(unread);

            $.ajax({
                url: $('base').attr('href') + (unread ? 'mark/' : 'unmark/') + id,
                data: { ajax: true },
                type: 'POST',
                error: function(jqXHR, textStatus, errorThrown) {
                    // rollback ui changes
                    selfoss.ui.entryMark(id, unread);
                    updateStats(!unread);
                    selfoss.ui.showError('Can not mark/unmark item: ' +
                                         textStatus + ' ' + errorThrown);
                }
            });

            return false;
        });
    }
};
